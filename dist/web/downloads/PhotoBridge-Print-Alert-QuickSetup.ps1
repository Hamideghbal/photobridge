param([string]$ServerUrl = '', [string]$Token = '')
$ErrorActionPreference = 'Stop'
try {
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class PhotoBridgeDpi {
  [DllImport("user32.dll")] public static extern bool SetProcessDpiAwarenessContext(IntPtr value);
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
}
'@ -ErrorAction SilentlyContinue
try { [PhotoBridgeDpi]::SetProcessDpiAwarenessContext([IntPtr](-4)) | Out-Null } catch { try { [PhotoBridgeDpi]::SetProcessDPIAware() | Out-Null } catch {} }
} catch {}
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()

$script:uiFontName='Segoe UI'
try{
  $installed=(New-Object System.Drawing.Text.InstalledFontCollection).Families.Name
  if($installed -contains 'Vazirmatn'){$script:uiFontName='Vazirmatn'}
  elseif($installed -contains 'Vazir'){$script:uiFontName='Vazir'}
  elseif($installed -contains 'Segoe UI Variable Text'){$script:uiFontName='Segoe UI Variable Text'}
}catch{}

$setupDir = Join-Path $env:TEMP 'PhotoBridgePrintAlertSetup'
$setupLog = Join-Path $env:TEMP 'PhotoBridge-Print-Alert-Setup.log'
$target = Join-Path $env:LOCALAPPDATA 'PhotoBridge\PrintAlert'

$script:uiFontRegularPath = Join-Path $target 'Vazirmatn-Regular.ttf'
$script:uiFontBoldPath = Join-Path $target 'Vazirmatn-Bold.ttf'
function Ensure-PhotoBridgeUiFonts {
  try {
    New-Item -ItemType Directory -Force -Path $target | Out-Null
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $fontSources=@(
      @($script:uiFontRegularPath,'https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/ttf/Vazirmatn-Regular.ttf'),
      @($script:uiFontBoldPath,'https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/ttf/Vazirmatn-Bold.ttf')
    )
    foreach($item in $fontSources){
      $path=[string]$item[0];$url=[string]$item[1]
      if(-not(Test-Path -LiteralPath $path) -or (Get-Item -LiteralPath $path).Length -lt 20000){
        try{Invoke-WebRequest -UseBasicParsing -Uri $url -OutFile $path -TimeoutSec 8;Setup-Log ('UI font downloaded '+[IO.Path]::GetFileName($path))}catch{Setup-Log ('UI font download warning: '+$_.Exception.Message)}
      }
    }
  } catch { Setup-Log ('UI font prepare warning: '+$_.Exception.Message) }
}

try{if(-not (Test-Path -LiteralPath $setupLog)){Set-Content -LiteralPath $setupLog -Value ((Get-Date).ToString('s')+' PhotoBridge setup opened') -Encoding UTF8}}catch{}
function Setup-Log([string]$Message){try { Add-Content -LiteralPath $setupLog -Value ((Get-Date).ToString('s')+' '+$Message) -Encoding UTF8 } catch {}}
function Ui-DoEvents { try { [System.Windows.Forms.Application]::DoEvents() } catch {} }

Add-Type -ReferencedAssemblies 'System.Windows.Forms','System.Drawing' -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Text;
using System.Runtime.InteropServices;
using System.Windows.Forms;

public sealed class PhotoBridgeModernSetupForm : Form {
    [DllImport("user32.dll")] private static extern bool ReleaseCapture();
    [DllImport("user32.dll")] private static extern IntPtr SendMessage(IntPtr hWnd, int msg, int wParam, int lParam);
    public event EventHandler LogRequested;
    public event EventHandler CloseRequested;

    private readonly string fontName;
    private PrivateFontCollection privateFonts;
    private FontFamily privateFamily;
    private Font titleFont, bodyFont, smallFont, boldFont, buttonFont, brandFont, closeFont;
    private string statusTitle="آماده‌سازی نصب";
    private string statusText="PhotoBridge مراحل نصب را به‌صورت خودکار انجام می‌دهد.";
    private string detailText="مرحله ۱ از ۴";
    private int progress=3;
    private bool completed=false;
    private bool success=false;
    private string hover="";
    private Rectangle closeRect, logRect, doneRect;

    public bool Completed { get { return completed; } }

    public PhotoBridgeModernSetupForm(string preferredFont) {
        fontName=String.IsNullOrWhiteSpace(preferredFont)?"Segoe UI":preferredFont;
        AutoScaleMode=AutoScaleMode.Dpi;
        ClientSize=new Size(500,286); MinimumSize=new Size(500,286); MaximumSize=new Size(500,286);
        FormBorderStyle=FormBorderStyle.None; StartPosition=FormStartPosition.CenterScreen; ShowInTaskbar=true; BackColor=Color.FromArgb(244,247,251);
        DoubleBuffered=true; SetStyle(ControlStyles.AllPaintingInWmPaint|ControlStyles.UserPaint|ControlStyles.OptimizedDoubleBuffer|ControlStyles.ResizeRedraw,true);
        BuildFonts();
    }
    protected override CreateParams CreateParams { get { var cp=base.CreateParams; cp.ClassStyle|=0x00020000; return cp; } }
    private Font UiFont(float size, FontStyle style) {
        try { if(privateFamily!=null) return new Font(privateFamily,size,style,GraphicsUnit.Point); } catch {}
        return new Font(fontName,size,style,GraphicsUnit.Point);
    }
    public bool UseFontFiles(string regularPath,string boldPath) {
        try {
            DisposeFonts();
            if(privateFonts!=null){privateFonts.Dispose();privateFonts=null;privateFamily=null;}
            var collection=new PrivateFontCollection();
            if(!String.IsNullOrWhiteSpace(regularPath)&&System.IO.File.Exists(regularPath)) collection.AddFontFile(regularPath);
            if(!String.IsNullOrWhiteSpace(boldPath)&&System.IO.File.Exists(boldPath)) collection.AddFontFile(boldPath);
            if(collection.Families.Length==0){collection.Dispose();return false;}
            privateFonts=collection;privateFamily=collection.Families[0];BuildFonts();Invalidate();Update();return true;
        } catch { return false; }
    }
    private void BuildFonts(){
        DisposeFonts();
        titleFont=UiFont(12.4f,FontStyle.Bold); bodyFont=UiFont(9.5f,FontStyle.Regular);
        smallFont=UiFont(8.3f,FontStyle.Regular); boldFont=UiFont(9.3f,FontStyle.Bold);
        buttonFont=UiFont(9.1f,FontStyle.Bold); brandFont=UiFont(10.6f,FontStyle.Bold); closeFont=new Font("Segoe UI",14f,FontStyle.Regular,GraphicsUnit.Point);
    }
    private void DisposeFonts(){if(titleFont!=null){titleFont.Dispose();titleFont=null;}if(bodyFont!=null){bodyFont.Dispose();bodyFont=null;}if(smallFont!=null){smallFont.Dispose();smallFont=null;}if(boldFont!=null){boldFont.Dispose();boldFont=null;}if(buttonFont!=null){buttonFont.Dispose();buttonFont=null;}if(brandFont!=null){brandFont.Dispose();brandFont=null;}if(closeFont!=null){closeFont.Dispose();closeFont=null;}}
    private Color C(string hex){return ColorTranslator.FromHtml(hex);}    
    private GraphicsPath Rounded(RectangleF r,float radius){float d=radius*2f;var p=new GraphicsPath();p.AddArc(r.X,r.Y,d,d,180,90);p.AddArc(r.Right-d,r.Y,d,d,270,90);p.AddArc(r.Right-d,r.Bottom-d,d,d,0,90);p.AddArc(r.X,r.Bottom-d,d,d,90,90);p.CloseFigure();return p;}
    private void FillRound(Graphics g,Brush b,RectangleF r,float radius){using(var p=Rounded(r,radius))g.FillPath(b,p);} private void DrawRound(Graphics g,Pen p,RectangleF r,float radius){using(var gp=Rounded(r,radius))g.DrawPath(p,gp);}
    private void DrawText(Graphics g,string text,Font font,Color color,Rectangle rect,bool right,bool center){TextFormatFlags f=TextFormatFlags.NoPrefix|TextFormatFlags.EndEllipsis|TextFormatFlags.VerticalCenter;if(center)f|=TextFormatFlags.HorizontalCenter;else if(right)f|=TextFormatFlags.Right|TextFormatFlags.RightToLeft;else f|=TextFormatFlags.Left;TextRenderer.DrawText(g,text??"",font,rect,color,f);}
    public void SetProgress(int value,string title,string text,string detail){progress=Math.Max(0,Math.Min(100,value));statusTitle=title;statusText=text;detailText=detail;Invalidate();Update();}
    public void SetFinal(bool ok,string title,string text,string detail){completed=true;success=ok;progress=ok?100:progress;statusTitle=title;statusText=text;detailText=detail;Invalidate();Update();}
    protected override void OnResize(EventArgs e){base.OnResize(e);if(ClientSize.Width>0&&ClientSize.Height>0){using(var p=Rounded(new RectangleF(0,0,ClientSize.Width,ClientSize.Height),18)){var old=Region;Region=new Region(p);if(old!=null)old.Dispose();}}}
    protected override void OnPaint(PaintEventArgs e){
        base.OnPaint(e);var g=e.Graphics;g.SmoothingMode=SmoothingMode.AntiAlias;g.PixelOffsetMode=PixelOffsetMode.HighQuality;g.TextRenderingHint=System.Drawing.Text.TextRenderingHint.ClearTypeGridFit;g.Clear(C("#F4F7FB"));
        using(var b=new SolidBrush(Color.White))FillRound(g,b,new RectangleF(1,1,ClientSize.Width-2,ClientSize.Height-2),18);using(var p=new Pen(C("#E4E7EC"),1))DrawRound(g,p,new RectangleF(1.5f,1.5f,ClientSize.Width-3,ClientSize.Height-3),18);
        using(var b=new SolidBrush(C("#5B5BD6")))FillRound(g,b,new RectangleF(0,0,ClientSize.Width,5),2);
        var brand=new Rectangle(440,19,40,40);using(var b=new SolidBrush(C("#5B5BD6")))FillRound(g,b,brand,12);DrawText(g,"PB",brandFont,Color.White,brand,false,true);
        DrawText(g,"نصب PhotoBridge Print Alert",titleFont,C("#101828"),new Rectangle(120,14,304,30),true,false);DrawText(g,"راه‌اندازی اعلان سفارش‌های چاپ در ویندوز",smallFont,C("#667085"),new Rectangle(120,42,304,22),true,false);
        closeRect=new Rectangle(18,18,34,34);using(var b=new SolidBrush(hover=="close"?C("#F2F4F7"):C("#F9FAFB")))FillRound(g,b,closeRect,17);DrawText(g,"×",closeFont,C("#667085"),closeRect,false,true);
        using(var p=new Pen(C("#EAECF0")))g.DrawLine(p,18,78,482,78);

        var card=new Rectangle(18,94,464,126);using(var b=new SolidBrush(C("#FCFCFD")))FillRound(g,b,card,14);using(var p=new Pen(C("#EAECF0")))DrawRound(g,p,card,14);
        DrawText(g,statusTitle,boldFont,C("#1D2939"),new Rectangle(40,104,420,25),true,false);DrawText(g,statusText,bodyFont,C("#667085"),new Rectangle(40,130,420,25),true,false);
        var track=new RectangleF(40,166,420,10);using(var b=new SolidBrush(C("#EAECF0")))FillRound(g,b,track,5);float pw=420f*progress/100f;if(pw>2){using(var b=new SolidBrush(success?C("#12B76A"):C("#5B5BD6")))FillRound(g,b,new RectangleF(40,166,pw,10),5);}
        DrawText(g,progress+"٪",boldFont,success?C("#067647"):C("#475467"),new Rectangle(40,180,55,23),false,false);DrawText(g,detailText,smallFont,C("#98A2B3"),new Rectangle(105,180,355,23),true,false);
        // Four step dots
        int[] steps=new int[]{12,34,66,90};for(int i=0;i<4;i++){int x=132+i*79;bool active=progress>=steps[i];using(var b=new SolidBrush(active?(success?C("#12B76A"):C("#5B5BD6")):C("#D0D5DD")))g.FillEllipse(b,x,205,8,8);if(i<3){using(var p=new Pen(C("#EAECF0"),2))g.DrawLine(p,x+10,209,x+76,209);}}

        logRect=new Rectangle(258,236,132,36);doneRect=new Rectangle(112,236,132,36);DrawButton(g,logRect,"مشاهده گزارش",true,Color.White,C("#475467"),"log",C("#D0D5DD"));
        string doneLabel=completed?"بستن":"در حال نصب…";Color doneBack=completed?(success?C("#12B76A"):C("#D92D20")):C("#F2F4F7");Color doneFore=completed?Color.White:C("#98A2B3");DrawButton(g,doneRect,doneLabel,completed,doneBack,doneFore,"done",doneBack);
    }
    private void DrawButton(Graphics g,Rectangle r,string label,bool enabled,Color back,Color fore,string key,Color border){Color bg=enabled?back:C("#F2F4F7");Color fg=enabled?fore:C("#98A2B3");if(enabled&&hover==key)bg=back==Color.White?C("#F9FAFB"):ControlPaint.Light(back,0.06f);using(var b=new SolidBrush(bg))FillRound(g,b,r,11);using(var p=new Pen(enabled?border:C("#EAECF0")))DrawRound(g,p,r,11);DrawText(g,label,buttonFont,fg,r,false,true);}
    protected override void OnMouseMove(MouseEventArgs e){base.OnMouseMove(e);string h="";if(closeRect.Contains(e.Location))h="close";else if(logRect.Contains(e.Location))h="log";else if(doneRect.Contains(e.Location)&&completed)h="done";Cursor=h==""?Cursors.Default:Cursors.Hand;if(h!=hover){hover=h;Invalidate();}}
    protected override void OnMouseLeave(EventArgs e){base.OnMouseLeave(e);hover="";Cursor=Cursors.Default;Invalidate();}
    protected override void OnMouseDown(MouseEventArgs e){base.OnMouseDown(e);if(e.Button==MouseButtons.Left&&e.Y<78&&!closeRect.Contains(e.Location)){ReleaseCapture();SendMessage(Handle,0xA1,0x2,0);}}
    protected override void OnMouseUp(MouseEventArgs e){base.OnMouseUp(e);if(e.Button!=MouseButtons.Left)return;if(logRect.Contains(e.Location)){if(LogRequested!=null)LogRequested(this,EventArgs.Empty);return;}if(doneRect.Contains(e.Location)&&completed){if(CloseRequested!=null)CloseRequested(this,EventArgs.Empty);return;}if(closeRect.Contains(e.Location)){if(CloseRequested!=null)CloseRequested(this,EventArgs.Empty);}}
    protected override void OnFormClosing(FormClosingEventArgs e){if(e.CloseReason==CloseReason.UserClosing&&!completed){e.Cancel=true;return;}base.OnFormClosing(e);}
    protected override void Dispose(bool disposing){if(disposing){DisposeFonts();if(privateFonts!=null){privateFonts.Dispose();privateFonts=null;privateFamily=null;}}base.Dispose(disposing);}
}
'@

$form=New-Object PhotoBridgeModernSetupForm -ArgumentList @($script:uiFontName)
try{if((Test-Path -LiteralPath $script:uiFontRegularPath)){[void]$form.UseFontFiles($script:uiFontRegularPath,$script:uiFontBoldPath)}}catch{}
$script:completed=$false
function Set-Step([int]$Value,[string]$Title,[string]$Text,[string]$DetailText=''){$form.SetProgress($Value,$Title,$Text,$DetailText);Ui-DoEvents}
function Set-Success {$script:completed=$true;$form.SetFinal($true,'نصب با موفقیت انجام شد','PhotoBridge Print Alert نصب و اجرا شد.','آیکون کنار ساعت ویندوز فعال است و با ورود بعدی هم اجرا می‌شود.');Ui-DoEvents}
function Set-Failure([string]$Message){$script:completed=$true;$form.SetFinal($false,'نصب کامل نشد',$Message,'برای جزئیات، گزارش نصب را باز کنید.');Ui-DoEvents}
$form.add_LogRequested({try{if(-not(Test-Path -LiteralPath $setupLog)){Set-Content -LiteralPath $setupLog -Value 'PhotoBridge setup log is not available yet.' -Encoding UTF8};Start-Process -FilePath 'notepad.exe' -ArgumentList @($setupLog)}catch{}})
$form.add_CloseRequested({if($script:completed){$form.Close()}else{[System.Windows.Forms.MessageBox]::Show('نصب هنوز در حال انجام است. چند لحظه صبر کنید.','PhotoBridge')|Out-Null}})

$run = {
    try {
        if(-not $ServerUrl -or -not $Token){ throw 'آدرس سرور یا کلید اتصال به نصب‌کننده نرسیده است.' }
        $server = $ServerUrl.Trim().TrimEnd('/')
        if(-not $server.StartsWith('https://') -and -not $server.StartsWith('http://')){ throw 'آدرس سرور PhotoBridge معتبر نیست.' }
        if($Token.Trim().Length -lt 32){ throw 'کلید اتصال PhotoBridge معتبر نیست.' }
        Set-Content -LiteralPath $setupLog -Value ((Get-Date).ToString('s')+' PhotoBridge modern setup started') -Encoding UTF8
        Ensure-PhotoBridgeUiFonts;try{if(Test-Path -LiteralPath $script:uiFontRegularPath){[void]$form.UseFontFiles($script:uiFontRegularPath,$script:uiFontBoldPath)}}catch{}

        Set-Step 12 'آماده‌سازی فایل‌های نصب' 'فضای موقت نصب در حال آماده شدن است.' 'مرحله ۱ از ۴'
        if(Test-Path -LiteralPath $setupDir){ Remove-Item -LiteralPath $setupDir -Recurse -Force -ErrorAction SilentlyContinue }
        New-Item -ItemType Directory -Force -Path $setupDir | Out-Null;Setup-Log 'STEP 1 prepared temp directory'

        Set-Step 34 'دانلود بسته PhotoBridge Alert' 'نسخه سازگار با این پنل از سرور دریافت می‌شود.' 'مرحله ۲ از ۴ · سرعت دانلود به اینترنت بستگی دارد'
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        $zip = Join-Path $setupDir 'PhotoBridge-Print-Alert-Windows.zip'
        Invoke-WebRequest -UseBasicParsing ($server+'/downloads/PhotoBridge-Print-Alert-Windows.zip') -OutFile $zip
        if((Get-Item -LiteralPath $zip).Length -lt 10000){ throw 'فایل دانلودشده ناقص است.' }
        Expand-Archive -LiteralPath $zip -DestinationPath $setupDir -Force
        $utf8NoBom = New-Object System.Text.UTF8Encoding($false);$utf8Bom = New-Object System.Text.UTF8Encoding($true)
        Get-ChildItem -LiteralPath $setupDir -Filter '*.ps1' -File | ForEach-Object {$txt=[System.IO.File]::ReadAllText($_.FullName,$utf8NoBom);[System.IO.File]::WriteAllText($_.FullName,$txt,$utf8Bom)}
        $install = Join-Path $setupDir 'Install.ps1';if(-not(Test-Path -LiteralPath $install)){throw 'Install.ps1 داخل بسته پیدا نشد.'};Setup-Log ('STEP 2 package downloaded bytes='+(Get-Item -LiteralPath $zip).Length)

        Set-Step 66 'نصب و اجرای Agent کنار ساعت' 'Startup و آیکون Tray در حال راه‌اندازی است.' 'مرحله ۳ از ۴ · معمولاً کمتر از ۲۰ ثانیه'
        $argumentLine = '-NoLogo -NoProfile -ExecutionPolicy Bypass -File "{0}" -ServerUrl "{1}" -Token "{2}" -Quiet' -f $install,$server,$Token.Trim()
        $proc = Start-Process -FilePath 'powershell.exe' -ArgumentList $argumentLine -PassThru -WindowStyle Hidden
        $watch=[System.Diagnostics.Stopwatch]::StartNew();$lastShown=-1
        while(-not $proc.HasExited){
            if($watch.Elapsed.TotalSeconds -ge 42){try{Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue}catch{};throw 'مرحله نصب Agent بیشتر از زمان مجاز طول کشید. گزارش نصب را باز کنید و نصب را دوباره اجرا کنید.'}
            $sec=[Math]::Floor($watch.Elapsed.TotalSeconds);if($sec -ne $lastShown){$lastShown=$sec;Set-Step 66 'نصب و اجرای Agent کنار ساعت' 'Startup و آیکون Tray در حال راه‌اندازی است.' ('مرحله ۳ از ۴ · '+$sec+' ثانیه سپری شده')}
            Ui-DoEvents;Start-Sleep -Milliseconds 140
        }
        $proc.WaitForExit();if($proc.ExitCode -ne 0){$tail='';try{if(Test-Path -LiteralPath $setupLog){$tail=(Get-Content -LiteralPath $setupLog -Tail 10 -ErrorAction SilentlyContinue)-join ' | '}}catch{};throw ('Agent نصب نشد.'+$(if($tail){' '+$tail}else{''}))}

        Set-Step 90 'بررسی نهایی نصب' 'اجرای Agent و Startup ویندوز در حال بررسی است.' 'مرحله ۴ از ۴'
        foreach($name in @('PhotoBridgePrintAlert.ps1','config.json','LaunchHidden.vbs','agent.ready')){if(-not(Test-Path -LiteralPath (Join-Path $target $name))){throw ('فایل مورد نیاز ساخته نشد: '+$name)}}
        $runValue=(Get-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run' -Name 'PhotoBridgePrintAlert' -ErrorAction Stop).PhotoBridgePrintAlert;if(-not $runValue){throw 'Startup ویندوز ثبت نشده است.'}
        Setup-Log 'STEP 4 verification OK';Set-Success;try{Remove-Item -LiteralPath $setupDir -Recurse -Force -ErrorAction SilentlyContinue}catch{}
    } catch {$message=[string]$_.Exception.Message;Setup-Log ('ERROR '+$message);Set-Failure $message}
}
$form.Add_Shown({$form.BeginInvoke([Action]$run)|Out-Null})
[System.Windows.Forms.Application]::Run($form)
