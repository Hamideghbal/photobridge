param([switch]$SyncOnly)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()

$root = Join-Path $env:LOCALAPPDATA 'PhotoBridge\OfflineIntake'
$ordersDir = Join-Path $root 'orders'
$agentConfig = Join-Path $env:LOCALAPPDATA 'PhotoBridge\PrintAlert\config.json'
$cachePath = Join-Path $root 'catalog.json'
$credentialPath = Join-Path $root 'admin-session.txt'
$verifierPath = Join-Path $root 'admin-local-verifier.json'
New-Item -ItemType Directory -Path $ordersDir -Force | Out-Null
if (!(Test-Path -LiteralPath $agentConfig)) { throw 'ابتدا ابزار اعلان PhotoBridge را از پنل لابراتوار نصب کنید.' }
$cfg = Get-Content -LiteralPath $agentConfig -Raw -Encoding UTF8 | ConvertFrom-Json
$server = ([string]$cfg.serverUrl).TrimEnd('/')
if ($server -notmatch '^https://') { throw 'برای سفارش آفلاین، اتصال امن HTTPS لازم است.' }

function Save-JsonAtomic($value, [string]$destination) {
    $temp = "$destination.tmp"
    $json = $value | ConvertTo-Json -Depth 25
    [System.IO.File]::WriteAllText($temp, $json, [System.Text.UTF8Encoding]::new($false))
    if ([IO.File]::Exists($destination)) { [IO.File]::Replace($temp, $destination, $null) }
    else { [IO.File]::Move($temp, $destination) }
}
function Load-Json([string]$file) {
    if (!(Test-Path -LiteralPath $file)) { return $null }
    return Get-Content -LiteralPath $file -Raw -Encoding UTF8 | ConvertFrom-Json
}
function Save-AdminToken([string]$raw) {
    $bytes = [Text.Encoding]::UTF8.GetBytes($raw)
    $encrypted = [Security.Cryptography.ProtectedData]::Protect(
        $bytes, $null, [Security.Cryptography.DataProtectionScope]::CurrentUser)
    [IO.File]::WriteAllText($credentialPath, [Convert]::ToBase64String($encrypted))
}
function Get-AdminToken {
    if (!(Test-Path -LiteralPath $credentialPath)) { return '' }
    try {
        $encrypted = [Convert]::FromBase64String([IO.File]::ReadAllText($credentialPath))
        $plain = [Security.Cryptography.ProtectedData]::Unprotect(
            $encrypted, $null, [Security.Cryptography.DataProtectionScope]::CurrentUser)
        return [Text.Encoding]::UTF8.GetString($plain)
    } catch { return '' }
}
function Save-LocalVerifier([string]$password) {
    $salt = New-Object byte[] 24
    [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($salt)
    $derive = New-Object Security.Cryptography.Rfc2898DeriveBytes($password, $salt, 120000)
    try { $hash = $derive.GetBytes(32) } finally { $derive.Dispose() }
    Save-JsonAtomic @{ salt = [Convert]::ToBase64String($salt); hash = [Convert]::ToBase64String($hash) } $verifierPath
}
function Test-LocalVerifier([string]$password) {
    $saved = Load-Json $verifierPath
    if (!$saved -or !$password) { return $false }
    try {
        $salt = [Convert]::FromBase64String([string]$saved.salt)
        $expected = [Convert]::FromBase64String([string]$saved.hash)
        $derive = New-Object Security.Cryptography.Rfc2898DeriveBytes($password, $salt, 120000)
        try { $actual = $derive.GetBytes(32) } finally { $derive.Dispose() }
        if ($expected.Length -ne $actual.Length) { return $false }
        $difference = 0
        for ($i = 0; $i -lt $expected.Length; $i++) { $difference = $difference -bor ($expected[$i] -bxor $actual[$i]) }
        return ($difference -eq 0)
    } catch { return $false }
}
function Request-Api([string]$route, [string]$method = 'GET', $payload = $null) {
    $raw = Get-AdminToken
    if (!$raw) { throw 'ابتدا با حساب ادمین لابراتوار وارد شوید.' }
    $args = @{ Uri = "$server$route"; Method = $method; TimeoutSec = 45;
        Headers = @{ Authorization = "Bearer $raw"; 'x-photobridge-portal' = 'lab' };
        UseBasicParsing = $true }
    if ($null -ne $payload) {
        $args.ContentType = 'application/json; charset=utf-8'
        $args.Body = [Text.Encoding]::UTF8.GetBytes(($payload | ConvertTo-Json -Depth 25 -Compress))
    }
    return Invoke-RestMethod @args
}
function Login-Admin([string]$mobile, [string]$password) {
    $body = @{ mobile = $mobile; password = $password } | ConvertTo-Json -Compress
    $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    $loginArgs = @{ Uri = "$server/api/auth/lab-login"; Method = 'POST'; WebSession = $session;
        ContentType = 'application/json; charset=utf-8'; TimeoutSec = 25;
        Body = [Text.Encoding]::UTF8.GetBytes($body) }
    $response = Invoke-RestMethod @loginArgs
    if (!$response.ok -or $response.me.user.labRole -ne 'lab_admin') { throw 'حساب ادمین لابراتوار تأیید نشد.' }
    $uri = New-Object Uri($server)
    $cookie = $session.Cookies.GetCookies($uri)['photobridge_lab_session']
    if (!$cookie -or !$cookie.Value) { throw 'نشست ادمین دریافت نشد.' }
    $headers = @{ Authorization = "Bearer $($cookie.Value)"; 'x-photobridge-portal' = 'lab' }
    $catalog = Invoke-RestMethod -Uri "$server/api/lab/delegated-orders/bootstrap" -Method GET -Headers $headers -TimeoutSec 30
    if (!$catalog.lab.id -or [string]$catalog.lab.id -ne [string]$response.me.lab.id) {
        throw 'لابراتوار انتخاب‌شده با حساب ادمین همخوان نیست.'
    }
    Save-AdminToken $cookie.Value
    Save-LocalVerifier $password
    Save-JsonAtomic $catalog $cachePath
    return $catalog
}
function Get-Catalog { return Load-Json $cachePath }
function Save-OfflineOrder($entry, [System.IO.FileInfo[]]$selected) {
    $id = [guid]::NewGuid().ToString()
    $dir = Join-Path $ordersDir $id
    $originals = Join-Path $dir 'originals'
    New-Item -ItemType Directory -Path $originals -Force | Out-Null
    $entry.clientOrderId = $id
    $entry.orderId = $null
    $entry.serverOrderNumber = $null
    $entry.invoiceNumber = $null
    $entry.syncedAt = $null
    $entry.state = 'queued'
    $entry.createdAt = (Get-Date).ToUniversalTime().ToString('o')
    $entry.files = @()
    try {
        foreach ($file in $selected) {
            $fid = [guid]::NewGuid().ToString()
            $extension = [IO.Path]::GetExtension($file.Name)
            $localName = "$fid$extension"
            Copy-Item -LiteralPath $file.FullName -Destination (Join-Path $originals $localName) -ErrorAction Stop
            $mime = switch ($extension.ToLowerInvariant()) {
                '.png' { 'image/png' }
                '.tif' { 'image/tiff' }
                '.tiff' { 'image/tiff' }
                '.psd' { 'image/vnd.adobe.photoshop' }
                default { 'image/jpeg' }
            }
            $entry.files += @{ clientFileId = $fid; localName = $localName; name = $file.Name;
                bytes = $file.Length; state = 'queued'; contentType = $mime }
        }
        Save-JsonAtomic $entry (Join-Path $dir 'order.json')
        return $dir
    } catch {
        Remove-Item -LiteralPath $dir -Recurse -Force -ErrorAction SilentlyContinue
        throw
    }
}
function Sync-Order([string]$dir) {
    $manifestPath = Join-Path $dir 'order.json'
    $order = Load-Json $manifestPath
    if (!$order -or $order.state -eq 'synced') { return }
    $catalog = Get-Catalog
    if (!$catalog -or !$catalog.lab.id) { throw 'فهرست لابراتوار ذخیره نشده است.' }
    if ([string]$order.labId -ne [string]$catalog.lab.id) { throw 'این سفارش برای لابراتوار دیگری ذخیره شده است.' }
    $request = @{ clientOrderId = $order.clientOrderId; mode = $order.mode;
        delivery = 'pickup'; priority = 'normal'; albumData = $order.albumData }
    if ($order.customerId) { $request.customerId = $order.customerId }
    else { $request.studioName = $order.studioName; $request.mobile = $order.mobile }
    $created = Request-Api '/api/lab/delegated-orders' 'POST' $request
    $order.orderId = [string]$(if ($created.orderId) { $created.orderId } else { $created.order.id })
    if ($created.status -and $created.status -ne 'uploading') {
        $order.state = 'synced'
        Save-JsonAtomic $order $manifestPath
        return
    }
    $order.state = 'uploading'
    Save-JsonAtomic $order $manifestPath
    foreach ($f in $order.files) {
        if ($f.state -eq 'active') { continue }
        $filePath = Join-Path (Join-Path $dir 'originals') ([string]$f.localName)
        if (!(Test-Path -LiteralPath $filePath)) { throw "فایل سفارش پیدا نشد: $($f.name)" }
        $selection = @{ clientFileId = $f.clientFileId; name = $f.name; relativePath = $f.name;
            bytes = [long]$f.bytes; contentType = $f.contentType; printType = $order.paperType }
        if ($order.mode -eq 'print') { $selection.printSizeId = $order.printSizeId }
        $prepared = Request-Api "/api/lab/delegated-orders/$($order.orderId)/files/presign" 'POST' $selection
        if ($prepared.state -ne 'active') {
            $upload = [string]$prepared.uploadUrl
            if ($upload.StartsWith('/')) { $upload = "$server$upload" }
            $headers = @{}
            if ($prepared.storageMode -eq 'local') {
                $headers.Authorization = "Bearer $(Get-AdminToken)"
                $headers['x-photobridge-portal'] = 'lab'
            }
            $uploadArgs = @{ Uri = $upload; Method = 'PUT'; InFile = $filePath;
                ContentType = $f.contentType; Headers = $headers; UseBasicParsing = $true; TimeoutSec = 600 }
            Invoke-WebRequest @uploadArgs | Out-Null
            Request-Api '/api/lab/delegated-files/complete' 'POST' @{ fileId = $f.clientFileId } | Out-Null
        }
        $f.state = 'active'
        Save-JsonAtomic $order $manifestPath
    }
    $submitted = Request-Api "/api/lab/delegated-orders/$($order.orderId)/submit" 'POST' @{}
    $order.state = 'synced'
    $order.serverOrderNumber = $submitted.order.number
    $order.invoiceNumber = $submitted.invoice.number
    $order.syncedAt = (Get-Date).ToUniversalTime().ToString('o')
    Save-JsonAtomic $order $manifestPath
}
function Sync-All {
    if (!(Get-AdminToken)) { return 'برای همگام‌سازی، یک‌بار با ادمین لابراتوار وارد شوید.' }
    try { $lock = [IO.File]::Open((Join-Path $root 'sync.lock'), 'OpenOrCreate', 'ReadWrite', 'None') }
    catch { return 'همگام‌سازی دیگری در حال انجام است.' }
    $done = 0; $failed = 0
    try {
        foreach ($folder in (Get-ChildItem -LiteralPath $ordersDir -Directory)) {
            try { Sync-Order $folder.FullName; $done++ }
            catch {
                $failed++
                $message = "$(Get-Date -Format s) $($folder.Name): $($_.Exception.Message)"
                Add-Content -LiteralPath (Join-Path $root 'sync-errors.log') -Value $message -Encoding UTF8
            }
        }
    } finally { $lock.Dispose() }
    return "بررسی سفارش‌ها: $done موفق، $failed نیازمند بررسی"
}

if ($SyncOnly) { Sync-All | Out-Null; exit }
$catalog = Get-Catalog
$form = New-Object Windows.Forms.Form
$form.Text = 'PhotoBridge | ثبت سفارش لابراتوار'
$form.Size = New-Object Drawing.Size(700, 650)
$form.StartPosition = 'CenterScreen'
$form.RightToLeft = 'Yes'
$form.RightToLeftLayout = $true
$form.BackColor = [Drawing.Color]::FromArgb(245, 249, 255)
$form.Font = New-Object Drawing.Font('Segoe UI', 10)
function Label([string]$text, [int]$y) {
    $control = New-Object Windows.Forms.Label
    $control.Text = $text; $control.Location = New-Object Drawing.Point(370, $y)
    $control.Size = New-Object Drawing.Size(275, 28)
    $form.Controls.Add($control)
}
function Input([int]$y) {
    $control = New-Object Windows.Forms.TextBox
    $control.Location = New-Object Drawing.Point(30, $y)
    $control.Size = New-Object Drawing.Size(325, 28)
    $form.Controls.Add($control); return $control
}
Label 'موبایل ادمین (برای اولین اتصال)' 25
$adminMobile = Input 25
Label 'رمز عبور ادمین' 60
$adminPassword = Input 60; $adminPassword.UseSystemPasswordChar = $true
$loginButton = New-Object Windows.Forms.Button
$loginButton.Text = 'ورود و تازه‌سازی فهرست'; $loginButton.Location = New-Object Drawing.Point(30, 95)
$loginButton.Size = New-Object Drawing.Size(325, 34); $form.Controls.Add($loginButton)
$offlineUnlock = New-Object Windows.Forms.Button
$offlineUnlock.Text = 'باز کردن با رمز ادمین در حالت آفلاین'
$offlineUnlock.Location = New-Object Drawing.Point(370, 95)
$offlineUnlock.Size = New-Object Drawing.Size(275, 34); $form.Controls.Add($offlineUnlock)
Label 'عکاسی موجود در لابراتوار' 150
$customer = New-Object Windows.Forms.ComboBox
$customer.Location = New-Object Drawing.Point(30, 150)
$customer.Size = New-Object Drawing.Size(325, 29)
$customer.DropDownStyle = 'DropDownList'; $form.Controls.Add($customer)
Label 'نام آتلیهٔ جدید (اگر در فهرست نیست)' 185
$studio = Input 185
Label 'موبایل آتلیهٔ جدید' 220
$mobile = Input 220
Label 'خدمت' 255
$mode = New-Object Windows.Forms.ComboBox
$mode.Location = New-Object Drawing.Point(30, 255)
$mode.Size = New-Object Drawing.Size(325, 29); $mode.DropDownStyle = 'DropDownList'
[void]$mode.Items.Add('چاپ عکس'); [void]$mode.Items.Add('صحافی آلبوم'); $mode.SelectedIndex = 0
$form.Controls.Add($mode)
Label 'اندازهٔ چاپ / آلبوم' 290
$size = New-Object Windows.Forms.ComboBox
$size.Location = New-Object Drawing.Point(30, 290)
$size.Size = New-Object Drawing.Size(325, 29); $size.DropDownStyle = 'DropDownList'
$form.Controls.Add($size)
Label 'نوع کاغذ' 325
$paper = New-Object Windows.Forms.ComboBox
$paper.Location = New-Object Drawing.Point(30, 325)
$paper.Size = New-Object Drawing.Size(325, 29); $paper.DropDownStyle = 'DropDownList'
[void]$paper.Items.Add('لاستر'); [void]$paper.Items.Add('سیلک'); [void]$paper.Items.Add('متالیک')
$paper.SelectedIndex = 0; $form.Controls.Add($paper)
Label 'جلد آلبوم' 360
$cover = New-Object Windows.Forms.ComboBox
$cover.Location = New-Object Drawing.Point(30, 360)
$cover.Size = New-Object Drawing.Size(325, 29); $cover.DropDownStyle = 'DropDownList'
$form.Controls.Add($cover)
$pick = New-Object Windows.Forms.Button
$pick.Text = 'انتخاب فایل‌ها'; $pick.Location = New-Object Drawing.Point(30, 410)
$pick.Size = New-Object Drawing.Size(150, 38); $form.Controls.Add($pick)
$filesInfo = New-Object Windows.Forms.Label
$filesInfo.Location = New-Object Drawing.Point(190, 415)
$filesInfo.Size = New-Object Drawing.Size(460, 30); $filesInfo.Text = 'فایلی انتخاب نشده است'
$form.Controls.Add($filesInfo)
$save = New-Object Windows.Forms.Button
$save.Text = 'ذخیرهٔ سفارش روی این رایانه'; $save.Location = New-Object Drawing.Point(30, 470)
$save.Size = New-Object Drawing.Size(325, 44)
$save.BackColor = [Drawing.Color]::FromArgb(34, 103, 195); $save.ForeColor = [Drawing.Color]::White
$form.Controls.Add($save)
$save.Enabled = $false
$sync = New-Object Windows.Forms.Button
$sync.Text = 'همگام‌سازی سفارش‌های ذخیره‌شده'; $sync.Location = New-Object Drawing.Point(370, 470)
$sync.Size = New-Object Drawing.Size(275, 44); $form.Controls.Add($sync)
$sync.Enabled = $false
$status = New-Object Windows.Forms.Label
$status.Location = New-Object Drawing.Point(30, 530)
$status.Size = New-Object Drawing.Size(615, 60)
$status.Text = 'سفارش آفلاین روی همین رایانه می‌ماند تا اتصال برقرار شود.'
$form.Controls.Add($status)
$selectedFiles = @()
function Fill-Catalog {
    $customer.Items.Clear(); [void]$customer.Items.Add('عکاسی جدید')
    foreach ($c in @($script:catalog.customers)) { [void]$customer.Items.Add("$($c.name) · $($c.mobile)") }
    $customer.SelectedIndex = 0
    Fill-Sizes
}
function Fill-Sizes {
    $size.Items.Clear(); $cover.Items.Clear()
    if ($mode.SelectedIndex -eq 0) {
        foreach ($s in @($script:catalog.printSizes)) { [void]$size.Items.Add([string]$s.label) }
    } else {
        foreach ($s in @($script:catalog.album.sizes)) { [void]$size.Items.Add([string]$s.label) }
        foreach ($v in @($script:catalog.album.covers)) { [void]$cover.Items.Add([string]$v.name) }
    }
    if ($size.Items.Count) { $size.SelectedIndex = 0 }
    if ($cover.Items.Count) { $cover.SelectedIndex = 0 }
    $cover.Enabled = ($mode.SelectedIndex -eq 1)
}
$mode.Add_SelectedIndexChanged({ if ($script:catalog) { Fill-Sizes } })
$loginButton.Add_Click({
    try {
        $script:catalog = Login-Admin $adminMobile.Text $adminPassword.Text
        $script:unlocked = $true; $save.Enabled = $true; $sync.Enabled = $true
        $adminPassword.Text = ''; Fill-Catalog
        $status.Text = 'فهرست عکاسی‌ها و تعرفه‌ها برای کار آفلاین ذخیره شد.'
    } catch { $status.Text = $_.Exception.Message }
})
$offlineUnlock.Add_Click({
    if ((Test-LocalVerifier $adminPassword.Text) -and $script:catalog -and (Get-AdminToken)) {
        $script:unlocked = $true; $save.Enabled = $true; $sync.Enabled = $true
        $adminPassword.Text = ''; Fill-Catalog
        $status.Text = 'ورود محلی انجام شد. سفارش‌ها روی این رایانه ذخیره می‌شوند.'
    } else { $status.Text = 'رمز ادمین یا اطلاعات ذخیره‌شده معتبر نیست.' }
})
$pick.Add_Click({
    $dialog = New-Object Windows.Forms.OpenFileDialog
    $dialog.Multiselect = $true
    $dialog.Filter = 'عکس|*.jpg;*.jpeg;*.png;*.tif;*.tiff;*.psd|همه فایل‌ها|*.*'
    if ($dialog.ShowDialog() -eq 'OK') {
        $script:selectedFiles = @($dialog.FileNames | ForEach-Object { Get-Item -LiteralPath $_ })
        $filesInfo.Text = "$($script:selectedFiles.Count) فایل انتخاب شد"
    }
})
$save.Add_Click({
    try {
        if (!$script:unlocked -or !$script:catalog -or !$script:catalog.lab.id) { throw 'ابتدا با رمز ادمین وارد شوید.' }
        if (!$script:selectedFiles.Count) { throw 'فایل سفارش را انتخاب کنید.' }
        if ($size.SelectedIndex -lt 0) { throw 'اندازه را انتخاب کنید.' }
        $paperType = @('luster','silk','metallic')[$paper.SelectedIndex]
        $entry = @{ customerId = $null; studioName = $studio.Text.Trim(); mobile = $mobile.Text.Trim()
            mode = $(if ($mode.SelectedIndex -eq 1) { 'album' } else { 'print' })
            paperType = $paperType; printSizeId = $null; albumData = $null;
            labId = [string]$script:catalog.lab.id }
        if ($customer.SelectedIndex -gt 0) {
            $entry.customerId = [string]@($script:catalog.customers)[$customer.SelectedIndex - 1].id
        } elseif (!$entry.studioName -or $entry.mobile -notmatch '^09\d{9}$') {
            throw 'نام آتلیه و موبایل معتبر را وارد کنید.'
        }
        if ($entry.mode -eq 'print') {
            $chosen = @($script:catalog.printSizes)[$size.SelectedIndex]
            $entry.printSizeId = [string]$chosen.id
            $rate = [long]$chosen.PSObject.Properties[$paperType].Value
            $entry.provisionalInvoice = @{ status = 'local_estimate'; amount = $rate * $script:selectedFiles.Count;
                itemCount = $script:selectedFiles.Count; rate = $rate; size = $chosen.label }
        } else {
            if (!$script:catalog.album.enabled) { throw 'صحافی برای این لابراتوار فعال نیست.' }
            if ($cover.SelectedIndex -lt 0) { throw 'جلد آلبوم را انتخاب کنید.' }
            $albumSize = @($script:catalog.album.sizes)[$size.SelectedIndex]
            $albumCover = @($script:catalog.album.covers)[$cover.SelectedIndex]
            $data = @{ sizeId = $albumSize.id; coverId = $albumCover.id;
                spreads = $script:selectedFiles.Count; paperType = $paperType }
            if (@($albumCover.colors).Count -gt 0) { $data.colorId = @($albumCover.colors)[0].id }
            $entry.albumData = $data
            $paperRate = [long]$albumSize.PSObject.Properties[$paperType].Value
            $entry.provisionalInvoice = @{ status = 'local_estimate'; amount = ($paperRate + [long]$albumSize.bindingPrice) * $script:selectedFiles.Count + [long]$albumCover.price;
                spreads = $script:selectedFiles.Count; size = $albumSize.label }
        }
        $saved = Save-OfflineOrder $entry $script:selectedFiles
        $status.Text = "سفارش روی رایانه ذخیره شد: $([IO.Path]::GetFileName($saved)). همگام‌سازی بعداً هم ممکن است."
    } catch { $status.Text = $_.Exception.Message }
})
$sync.Add_Click({
    try { $status.Text = Sync-All }
    catch { $status.Text = $_.Exception.Message }
})
[void]$form.ShowDialog()
