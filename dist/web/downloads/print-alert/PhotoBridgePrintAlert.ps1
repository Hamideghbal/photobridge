param([string]$ConfigPath = "")
$ErrorActionPreference = 'Stop'

# High-DPI rendering: Windows 10/11, 100%-200% scaling.
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

if (-not $ConfigPath) { $ConfigPath = Join-Path $env:LOCALAPPDATA 'PhotoBridge\PrintAlert\config.json' }
$script:baseDir=Split-Path -Parent $ConfigPath
$script:offlineScriptPath=Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) 'PhotoBridgeOfflineIntake.ps1'
$script:uiFontRegularPath=Join-Path $script:baseDir 'Vazirmatn-Regular.ttf'
$script:uiFontBoldPath=Join-Path $script:baseDir 'Vazirmatn-Bold.ttf'
$script:privateFontCollection=$null
$script:uiFontFamily=$null
$script:uiFontName='Segoe UI'
try{
  $privateFonts=New-Object System.Drawing.Text.PrivateFontCollection
  if(Test-Path -LiteralPath $script:uiFontRegularPath){$privateFonts.AddFontFile($script:uiFontRegularPath)}
  if(Test-Path -LiteralPath $script:uiFontBoldPath){$privateFonts.AddFontFile($script:uiFontBoldPath)}
  if($privateFonts.Families.Count -gt 0){$script:privateFontCollection=$privateFonts;$script:uiFontFamily=$privateFonts.Families[0];$script:uiFontName=$script:uiFontFamily.Name}else{$privateFonts.Dispose()}
}catch{}
if(-not $script:uiFontFamily){
  try{
    $installed=(New-Object System.Drawing.Text.InstalledFontCollection).Families.Name
    if($installed -contains 'Vazirmatn'){$script:uiFontName='Vazirmatn'}
    elseif($installed -contains 'Vazir'){$script:uiFontName='Vazir'}
    elseif($installed -contains 'Segoe UI Variable Text'){$script:uiFontName='Segoe UI Variable Text'}
  }catch{}
}
function New-UiFont([float]$size,[System.Drawing.FontStyle]$style=[System.Drawing.FontStyle]::Regular){
  if($script:uiFontFamily){return New-Object System.Drawing.Font($script:uiFontFamily,$size,$style,[System.Drawing.GraphicsUnit]::Point)}
  return New-Object System.Drawing.Font($script:uiFontName,$size,$style,[System.Drawing.GraphicsUnit]::Point)
}
New-Item -ItemType Directory -Force -Path $script:baseDir | Out-Null
$script:logPath=Join-Path $script:baseDir 'agent.log'
$script:readyPath=Join-Path $script:baseDir 'agent.ready'
$script:shutdownPath=Join-Path $script:baseDir 'agent.shutdown'
function Write-Log([string]$message){try{Add-Content -LiteralPath $script:logPath -Value ((Get-Date).ToString('s')+' '+$message) -Encoding UTF8}catch{}}
trap { Write-Log ('FATAL '+$_.Exception.Message); try{if($script:lockStream){$script:lockStream.Dispose()}}catch{}; try{[System.Windows.Forms.MessageBox]::Show('PhotoBridge Print Alert متوقف شد. گزارش خطا در این مسیر ذخیره شده است:'+[Environment]::NewLine+$script:logPath,'PhotoBridge')|Out-Null}catch{}; exit 1 }
try{$script:lockStream=[System.IO.File]::Open((Join-Path $script:baseDir 'agent.lock'),[System.IO.FileMode]::OpenOrCreate,[System.IO.FileAccess]::ReadWrite,[System.IO.FileShare]::None)}catch{Write-Log 'Another agent instance is already running';exit 0}
Remove-Item -LiteralPath $script:readyPath -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath $script:shutdownPath -Force -ErrorAction SilentlyContinue
if (-not (Test-Path $ConfigPath)) { Write-Log 'config.json not found'; [System.Windows.Forms.MessageBox]::Show('تنظیمات PhotoBridge Print Alert پیدا نشد. نصب خودکار را دوباره اجرا کنید.','PhotoBridge') | Out-Null; exit 1 }
$cfg = Get-Content -LiteralPath $ConfigPath -Raw -Encoding UTF8 | ConvertFrom-Json
$server = ([string]$cfg.serverUrl).TrimEnd('/')
$token = [string]$cfg.token
if (-not $server -or -not $token) { Write-Log 'server/token missing in config'; exit 1 }
Write-Log ('START server='+$server)

try{Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class PhotoBridgeNativeIcon {
  [DllImport("user32.dll", CharSet=CharSet.Auto)] public static extern bool DestroyIcon(IntPtr handle);
}
'@ -ErrorAction SilentlyContinue}catch{}

$script:pending = @()
$script:lastBalloonKey = ''
$script:lastBalloonAt = [datetime]::MinValue
$script:mutedKey = ''
$script:alarmPlaying = $false
$script:lastIconCount = -1
$script:lastPollError = ''
$script:lastPollErrorAt = [datetime]::MinValue
$script:labName = 'PhotoBridge'
$script:webPanelActive = $false
$script:manualPanelOpen = $false
$validAlarmModes=@('strong','balanced','gentle','silent')
$script:alarmMode=if($cfg.PSObject.Properties.Name -contains 'alarmMode' -and $validAlarmModes -contains ([string]$cfg.alarmMode)){[string]$cfg.alarmMode}else{'balanced'}
$script:lastOneShotKey=''
$script:lastChatKey=''
$script:chatInitialized=$false
$script:chatDisplayUntil=[datetime]::MinValue
$script:lastBalloonTarget='panel'
$script:lastChatOpenUrl="$server/lab"
$script:soundPath = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) 'PhotoBridgeAlert.wav'
$script:soundPlayer = if(Test-Path $script:soundPath){ New-Object System.Media.SoundPlayer $script:soundPath }else{$null}
if($script:soundPlayer){ try{$script:soundPlayer.Load()}catch{$script:soundPlayer=$null} }
function New-CountIcon([int]$count,[int]$canvas=64) {
    $bmp = New-Object System.Drawing.Bitmap $canvas,$canvas
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
    $g.Clear([System.Drawing.Color]::Transparent)
    $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(79,70,229))
    $pad=[Math]::Max(2,[int]($canvas*.04));$diam=$canvas-($pad*2)
    $g.FillEllipse($brush,$pad,$pad,$diam,$diam)
    $text = if($count -gt 99){'99+'}elseif($count -gt 0){[string]$count}else{'PB'}
    $size = [int]($(if($text.Length -ge 3){$canvas*.28}elseif($text.Length -eq 2){$canvas*.36}else{$canvas*.42}))
    $font = New-Object System.Drawing.Font('Segoe UI',$size,[System.Drawing.FontStyle]::Bold,[System.Drawing.GraphicsUnit]::Pixel)
    $white = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
    $format = New-Object System.Drawing.StringFormat
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center
    $g.DrawString($text,$font,$white,(New-Object System.Drawing.RectangleF 0,0,$canvas,$canvas),$format)
    $hIcon = $bmp.GetHicon()
    try { $icon = [System.Drawing.Icon]::FromHandle($hIcon).Clone() } finally { try{[PhotoBridgeNativeIcon]::DestroyIcon($hIcon)|Out-Null}catch{} }
    $g.Dispose();$brush.Dispose();$white.Dispose();$font.Dispose();$format.Dispose();$bmp.Dispose()
    return $icon
}

function Format-Bytes([double]$bytes){
    if($bytes -le 0){return '—'}
    if($bytes -lt 1MB){return ('{0:N0} KB' -f ($bytes/1KB))}
    if($bytes -lt 1GB){return ('{0:N1} MB' -f ($bytes/1MB))}
    return ('{0:N2} GB' -f ($bytes/1GB))
}
function Priority-Text([string]$value){if($value -eq 'very_urgent'){return 'خیلی فوری'}elseif($value -eq 'urgent'){return 'فوری'}return 'عادی'}

# Vector-rendered UI: no stock WinForms buttons/list controls. Everything is painted at the current DPI.
Add-Type -ReferencedAssemblies 'System.Windows.Forms','System.Drawing' -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Text;
using System.Runtime.InteropServices;
using System.Windows.Forms;

public sealed class PhotoBridgeAlertOrder {
    public string Number { get; set; }
    public string Customer { get; set; }
    public string Files { get; set; }
    public string Size { get; set; }
    public string Priority { get; set; }
}

public sealed class PhotoBridgeModernAlertForm : Form {
    [DllImport("user32.dll")] private static extern bool ReleaseCapture();
    [DllImport("user32.dll")] private static extern IntPtr SendMessage(IntPtr hWnd, int msg, int wParam, int lParam);

    public event EventHandler AckRequested;
    public event EventHandler OpenRequested;
    public event EventHandler MuteRequested;
    public event EventHandler HideRequested;

    private readonly string fontName;
    private PrivateFontCollection privateFonts;
    private FontFamily privateFamily;
    private Font titleFont, bodyFont, smallFont, boldFont, buttonFont, countFont, brandFont, closeFont;
    private List<PhotoBridgeAlertOrder> orders = new List<PhotoBridgeAlertOrder>();
    private string labName = "PhotoBridge";
    private string statusText = "در حال اتصال…";
    private string stateText = "متصل و آماده دریافت سفارش";
    private string muteText = "بی‌صدا";
    private string chatSender = "";
    private string chatMessage = "";
    private int count = 0;
    private bool webActive = false;
    private bool disconnected = false;
    private string hover = "";

    private Rectangle closeRect, ackRect, openRect, muteRect, listRect;

    public PhotoBridgeModernAlertForm(string preferredFont, string regularFontPath, string boldFontPath) {
        fontName = String.IsNullOrWhiteSpace(preferredFont) ? "Segoe UI" : preferredFont;
        try {
            var collection=new PrivateFontCollection();
            if(!String.IsNullOrWhiteSpace(regularFontPath)&&System.IO.File.Exists(regularFontPath)) collection.AddFontFile(regularFontPath);
            if(!String.IsNullOrWhiteSpace(boldFontPath)&&System.IO.File.Exists(boldFontPath)) collection.AddFontFile(boldFontPath);
            if(collection.Families.Length>0){privateFonts=collection;privateFamily=collection.Families[0];}else collection.Dispose();
        } catch {}
        AutoScaleMode = AutoScaleMode.None;
        ClientSize = new Size(560, 430);
        MinimumSize = new Size(560, 430);
        MaximumSize = new Size(560, 430);
        FormBorderStyle = FormBorderStyle.None;
        StartPosition = FormStartPosition.Manual;
        ShowInTaskbar = false;
        TopMost = true;
        BackColor = Color.FromArgb(244,247,251);
        DoubleBuffered = true;
        SetStyle(ControlStyles.AllPaintingInWmPaint | ControlStyles.UserPaint | ControlStyles.OptimizedDoubleBuffer | ControlStyles.ResizeRedraw, true);
        BuildFonts();
    }

    protected override CreateParams CreateParams {
        get { var cp = base.CreateParams; cp.ClassStyle |= 0x00020000; return cp; }
    }

    private Font UiFont(float size, FontStyle style) {
        try { if(privateFamily!=null) return new Font(privateFamily,size*1.333f,style,GraphicsUnit.Pixel); } catch {}
        return new Font(fontName,size*1.333f,style,GraphicsUnit.Pixel);
    }

    private void BuildFonts() {
        DisposeFonts();
        titleFont = UiFont(12.4f, FontStyle.Bold);
        bodyFont = UiFont(9.6f, FontStyle.Regular);
        smallFont = UiFont(8.4f, FontStyle.Regular);
        boldFont = UiFont(9.3f, FontStyle.Bold);
        buttonFont = UiFont(9.2f, FontStyle.Bold);
        countFont = UiFont(10.8f, FontStyle.Bold);
        brandFont = UiFont(10.6f, FontStyle.Bold);
        closeFont = new Font("Segoe UI", 18f, FontStyle.Regular, GraphicsUnit.Pixel);
    }

    private void DisposeFonts() {
        if (titleFont != null) { titleFont.Dispose(); titleFont=null; } if (bodyFont != null) { bodyFont.Dispose(); bodyFont=null; } if (smallFont != null) { smallFont.Dispose(); smallFont=null; }
        if (boldFont != null) { boldFont.Dispose(); boldFont=null; } if (buttonFont != null) { buttonFont.Dispose(); buttonFont=null; } if (countFont != null) { countFont.Dispose(); countFont=null; } if (brandFont != null) { brandFont.Dispose(); brandFont=null; } if (closeFont != null) { closeFont.Dispose(); closeFont=null; }
    }

    private GraphicsPath Rounded(RectangleF r, float radius) {
        float d = radius * 2f;
        var p = new GraphicsPath();
        p.AddArc(r.X, r.Y, d, d, 180, 90); p.AddArc(r.Right-d, r.Y, d, d, 270, 90);
        p.AddArc(r.Right-d, r.Bottom-d, d, d, 0, 90); p.AddArc(r.X, r.Bottom-d, d, d, 90, 90); p.CloseFigure();
        return p;
    }

    private void FillRound(Graphics g, Brush b, RectangleF r, float radius) { using(var p=Rounded(r,radius)) g.FillPath(b,p); }
    private void DrawRound(Graphics g, Pen p, RectangleF r, float radius) { using(var gp=Rounded(r,radius)) g.DrawPath(p,gp); }

    private void DrawText(Graphics g, string text, Font font, Color color, Rectangle rect, bool right, bool center=false) {
        TextFormatFlags flags = TextFormatFlags.NoPrefix | TextFormatFlags.EndEllipsis | TextFormatFlags.VerticalCenter;
        if (center) flags |= TextFormatFlags.HorizontalCenter;
        else if (right) flags |= TextFormatFlags.Right | TextFormatFlags.RightToLeft;
        else flags |= TextFormatFlags.Left;
        TextRenderer.DrawText(g, text ?? "", font, rect, color, flags);
    }

    private Color C(string hex) { return ColorTranslator.FromHtml(hex); }

    public void SetState(string newLabName, int newCount, bool newWebActive, string newMuteText, PhotoBridgeAlertOrder[] newOrders) {
        labName = String.IsNullOrWhiteSpace(newLabName) ? "PhotoBridge" : newLabName;
        count = Math.Max(0,newCount); webActive = newWebActive; disconnected = false;
        muteText = String.IsNullOrWhiteSpace(newMuteText) ? "بی‌صدا" : newMuteText;
        orders = new List<PhotoBridgeAlertOrder>(); if(newOrders != null) orders.AddRange(newOrders);
        statusText = count > 0 ? labName + " · " + count + " سفارش" : labName;
        stateText = webActive ? "پنل مرورگر باز است · هشدار صوتی غیرفعال" : (count > 0 ? "هشدار فعال · نیازمند توجه" : "متصل و آماده دریافت سفارش");
        Invalidate();
    }

    public void SetDisconnected() { disconnected = true; statusText = "اتصال به سرور برقرار نیست"; stateText = "در انتظار اتصال مجدد"; Invalidate(); }

    public void SetChatAlert(string sender, string message) {
        chatSender = sender ?? ""; chatMessage = message ?? ""; Invalidate();
    }

    protected override void OnResize(EventArgs e) {
        base.OnResize(e);
        if (ClientSize.Width > 0 && ClientSize.Height > 0) {
            using(var p=Rounded(new RectangleF(0,0,ClientSize.Width,ClientSize.Height),18)) {
                var old=Region; Region=new Region(p); if(old!=null)old.Dispose();
            }
        }
    }

    protected override void OnPaint(PaintEventArgs e) {
        base.OnPaint(e);
        var g=e.Graphics; g.SmoothingMode=SmoothingMode.AntiAlias; g.PixelOffsetMode=PixelOffsetMode.HighQuality; g.TextRenderingHint=System.Drawing.Text.TextRenderingHint.ClearTypeGridFit;
        g.Clear(C("#F4F7FB"));

        // Main shell
        using(var white=new SolidBrush(Color.White)) FillRound(g,white,new RectangleF(1,1,ClientSize.Width-2,ClientSize.Height-2),18);
        using(var border=new Pen(C("#E4E7EC"),1)) DrawRound(g,border,new RectangleF(1.5f,1.5f,ClientSize.Width-3,ClientSize.Height-3),18);

        // Accent
        using(var accent=new SolidBrush(C("#5B5BD6"))) FillRound(g,accent,new RectangleF(0,0,ClientSize.Width,5),2);

        // Header badges
        var brandRect=new Rectangle(500,20,40,40); using(var b=new SolidBrush(C("#5B5BD6"))) FillRound(g,b,brandRect,12);
        DrawText(g,"PB",brandFont,Color.White,brandRect,false,true);
        var countRect=new Rectangle(454,22,36,36); using(var b=new SolidBrush(count>0?C("#D92D20"):C("#12B76A"))) FillRound(g,b,countRect,18);
        DrawText(g,count.ToString(),countFont,Color.White,countRect,false,true);

        DrawText(g,"PhotoBridge Print Alert",titleFont,C("#101828"),new Rectangle(156,12,286,32),true);
        DrawText(g,statusText,bodyFont,C("#667085"),new Rectangle(156,42,286,25),true);
        var stateColor = disconnected ? C("#D92D20") : ((!webActive && count>0) ? C("#B54708") : C("#067647"));
        using(var dot=new SolidBrush(stateColor)) g.FillEllipse(dot,430,74,8,8);
        DrawText(g,stateText,smallFont,stateColor,new Rectangle(156,67,264,28),true);

        // Close button
        closeRect=new Rectangle(18,20,36,36); using(var b=new SolidBrush(hover=="close"?C("#F2F4F7"):C("#F9FAFB"))) FillRound(g,b,closeRect,17);
        DrawText(g,"×",closeFont,C("#667085"),closeRect,false,true);

        // Divider
        using(var p=new Pen(C("#EAECF0"))) g.DrawLine(p,18,104,ClientSize.Width-18,104);

        // Orders card
        listRect=new Rectangle(18,120,524,190); using(var b=new SolidBrush(C("#FCFCFD"))) FillRound(g,b,listRect,14); using(var p=new Pen(C("#EAECF0"))) DrawRound(g,p,listRect,14);
        DrawText(g,"سفارش‌های نیازمند توجه",boldFont,C("#1D2939"),new Rectangle(274,126,250,26),true);
        DrawText(g,"برای ورود به پنل روی این بخش دوبار کلیک کنید",smallFont,C("#98A2B3"),new Rectangle(34,126,232,26),true);
        using(var p=new Pen(C("#EAECF0"))) g.DrawLine(p,34,160,526,160);

        if (orders.Count == 0) {
            using(var b=new SolidBrush(C("#ECFDF3"))) FillRound(g,b,new RectangleF(205,188,150,44),12);
            DrawText(g,"همه‌چیز مرتب است",boldFont,C("#067647"),new Rectangle(208,190,144,40),false,true);
            DrawText(g,"سفارشی منتظر تأیید نیست",smallFont,C("#667085"),new Rectangle(80,242,400,28),false,true);
        } else {
            int shown=Math.Min(orders.Count,4);
            for(int i=0;i<shown;i++) {
                var o=orders[i]; int y=166+i*32;
                if(i>0){using(var p=new Pen(C("#F2F4F7"))) g.DrawLine(p,34,y-2,526,y-2);}
                Color pri = o.Priority=="خیلی فوری"?C("#B42318"):(o.Priority=="فوری"?C("#B54708"):C("#475467"));
                DrawText(g,"#"+o.Number,boldFont,C("#344054"),new Rectangle(452,y,74,30),true);
                DrawText(g,o.Customer,bodyFont,C("#344054"),new Rectangle(260,y,188,30),true);
                DrawText(g,o.Files+" فایل",smallFont,C("#667085"),new Rectangle(184,y,72,30),true);
                DrawText(g,o.Size,smallFont,C("#667085"),new Rectangle(104,y,76,30),true);
                DrawText(g,o.Priority,boldFont,pri,new Rectangle(34,y,66,30),true);
            }
            if(orders.Count>4){DrawText(g,"+ "+(orders.Count-4)+" سفارش دیگر",smallFont,C("#667085"),new Rectangle(34,292,492,18),false,true);}
        }

        // Action buttons
        int yBtn=328; ackRect=new Rectangle(378,yBtn,164,44); openRect=new Rectangle(198,yBtn,164,44); muteRect=new Rectangle(18,yBtn,164,44);
        DrawButton(g,ackRect,"تأیید سفارش‌ها",count>0,C("#12B76A"),Color.White,"ack");
        DrawButton(g,openRect,"باز کردن پنل",true,C("#5B5BD6"),Color.White,"open");
        DrawButton(g,muteRect,muteText,count>0,Color.White,C("#475467"),"mute",C("#D0D5DD"));
        if(!String.IsNullOrWhiteSpace(chatMessage)) {
            using(var b=new SolidBrush(C("#EEF4FF"))) FillRound(g,b,new RectangleF(18,379,524,43),11);
            DrawText(g,"پیام جدید · "+chatSender,boldFont,C("#1D4ED8"),new Rectangle(285,381,240,18),true);
            DrawText(g,chatMessage,smallFont,C("#344054"),new Rectangle(30,399,495,19),true);
        } else {
            DrawText(g,"این پنجره بعد از باز کردن دستی، تا وقتی خودتان × را نزنید باز می‌ماند.",smallFont,C("#667085"),new Rectangle(24,381,512,20),false,true);
            DrawText(g,"بستن پنجره Agent را متوقف نمی‌کند؛ آیکون کنار ساعت فعال می‌ماند.",smallFont,C("#98A2B3"),new Rectangle(24,402,512,20),false,true);
        }
    }

    private void DrawButton(Graphics g, Rectangle r, string label, bool enabled, Color back, Color fore, string key) { DrawButton(g,r,label,enabled,back,fore,key,back); }
    private void DrawButton(Graphics g, Rectangle r, string label, bool enabled, Color back, Color fore, string key, Color border) {
        Color bg = enabled ? back : C("#F2F4F7"); Color fg = enabled ? fore : C("#98A2B3");
        if(enabled && hover==key) bg = back==Color.White ? C("#F9FAFB") : ControlPaint.Light(back,0.06f);
        using(var b=new SolidBrush(bg)) FillRound(g,b,r,12); using(var p=new Pen(enabled?border:C("#EAECF0"),1)) DrawRound(g,p,r,12);
        DrawText(g,label,buttonFont,fg,r,false,true);
    }

    protected override void OnMouseMove(MouseEventArgs e) {
        base.OnMouseMove(e); string h="";
        if(closeRect.Contains(e.Location))h="close"; else if(ackRect.Contains(e.Location)&&count>0)h="ack"; else if(openRect.Contains(e.Location))h="open"; else if(muteRect.Contains(e.Location)&&count>0)h="mute";
        Cursor = h==""?Cursors.Default:Cursors.Hand; if(h!=hover){hover=h;Invalidate();}
    }
    protected override void OnMouseLeave(EventArgs e){base.OnMouseLeave(e);hover="";Cursor=Cursors.Default;Invalidate();}
    protected override void OnMouseDown(MouseEventArgs e){base.OnMouseDown(e); if(e.Button==MouseButtons.Left && e.Y<104 && !closeRect.Contains(e.Location)){ReleaseCapture();SendMessage(Handle,0xA1,0x2,0);}}
    protected override void OnMouseUp(MouseEventArgs e){
        base.OnMouseUp(e); if(e.Button!=MouseButtons.Left)return;
        if(closeRect.Contains(e.Location)){if(HideRequested!=null)HideRequested(this,EventArgs.Empty);return;}
        if(ackRect.Contains(e.Location)&&count>0){if(AckRequested!=null)AckRequested(this,EventArgs.Empty);return;}
        if(openRect.Contains(e.Location)){if(OpenRequested!=null)OpenRequested(this,EventArgs.Empty);return;}
        if(muteRect.Contains(e.Location)&&count>0){if(MuteRequested!=null)MuteRequested(this,EventArgs.Empty);return;}
    }
    protected override void OnMouseDoubleClick(MouseEventArgs e){base.OnMouseDoubleClick(e);if(listRect.Contains(e.Location)&&OpenRequested!=null)OpenRequested(this,EventArgs.Empty);}
    protected override void OnFormClosing(FormClosingEventArgs e){if(e.CloseReason==CloseReason.UserClosing){e.Cancel=true;if(HideRequested!=null)HideRequested(this,EventArgs.Empty);return;}base.OnFormClosing(e);}
    protected override void Dispose(bool disposing){if(disposing){DisposeFonts();if(privateFonts!=null){privateFonts.Dispose();privateFonts=null;privateFamily=null;}}base.Dispose(disposing);}
}
'@

$notify = New-Object System.Windows.Forms.NotifyIcon
$notify.Text = 'PhotoBridge Print Alert'
$notify.Visible = $true
$script:trayIcon = New-CountIcon 0 64
$notify.Icon = $script:trayIcon

$menu = New-Object System.Windows.Forms.ContextMenuStrip
$menu.Font = New-UiFont 9.5
$showItem = $menu.Items.Add('نمایش سفارش‌های جدید')
$openItem = $menu.Items.Add('باز کردن PhotoBridge')
$offlineItem = $menu.Items.Add('ثبت سفارش آفلاین لابراتوار')
$ackItem = $menu.Items.Add('تأیید هشدارهای فعلی')
$alarmMenu = New-Object System.Windows.Forms.ToolStripMenuItem('نوع هشدار')
$alarmStrongItem=$alarmMenu.DropDownItems.Add('قوی و مداوم')
$alarmBalancedItem=$alarmMenu.DropDownItems.Add('متعادل')
$alarmGentleItem=$alarmMenu.DropDownItems.Add('ملایم')
$alarmSilentItem=$alarmMenu.DropDownItems.Add('بی‌صدا')
$menu.Items.Add($alarmMenu)|Out-Null
$testItem = $menu.Items.Add('تست هشدار انتخاب‌شده')
$soundTestItem = $menu.Items.Add('تست صدا')
$versionItem = $menu.Items.Add('نسخه Agent: 0.17.295')
$versionItem.Enabled=$false
$logItem = $menu.Items.Add('باز کردن گزارش اجرا')
$menu.Items.Add('-') | Out-Null
$exitItem = $menu.Items.Add('خروج')
$notify.ContextMenuStrip = $menu

$form = New-Object PhotoBridgeModernAlertForm -ArgumentList @($script:uiFontName,$script:uiFontRegularPath,$script:uiFontBoldPath)

function Position-Panel {
    $screen=[System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea
    $form.Location=New-Object System.Drawing.Point(($screen.Right-$form.Width-16),($screen.Bottom-$form.Height-16))
}
function Show-Panel([bool]$manual=$false) { if($manual){$script:manualPanelOpen=$true};Position-Panel;if(-not $form.Visible){$form.Show()};$form.BringToFront();$form.Activate() }
function Hide-Panel { if($form.Visible){$form.Hide()};$script:manualPanelOpen=$false }

function Request([string]$path,[string]$method='GET',$body=$null) {
    $headers = @{ 'x-photobridge-print-agent-token' = $token }
    $args = @{ Uri = "$server$path"; Method=$method; Headers=$headers; TimeoutSec=6; UseBasicParsing=$true }
    if($null -ne $body){ $args['ContentType']='application/json'; $args['Body']=($body|ConvertTo-Json -Depth 5 -Compress) }
    return Invoke-RestMethod @args
}
function Set-Icon([int]$count){
    if($script:lastIconCount -ne $count){
        $newIcon=New-CountIcon $count 64
        $old=$notify.Icon
        $notify.Icon=$newIcon
        $script:trayIcon=$newIcon
        $script:lastIconCount=$count
        if($null -ne $old){try{$old.Dispose()}catch{}}
    }
    $notify.Text = if($script:webPanelActive){if($count -gt 0){"PhotoBridge - پنل باز است · $count سفارش"}else{'PhotoBridge - پنل لابراتوار باز است'}}elseif($count -gt 0){"PhotoBridge - $count سفارش چاپ جدید"}else{'PhotoBridge - سفارشی در انتظار نیست'}
}
function Save-AlarmMode([string]$mode){
    try{
        $saved=Get-Content -LiteralPath $ConfigPath -Raw -Encoding UTF8|ConvertFrom-Json
        if($saved.PSObject.Properties.Name -contains 'alarmMode'){$saved.alarmMode=$mode}else{$saved|Add-Member -NotePropertyName alarmMode -NotePropertyValue $mode}
        $saved|ConvertTo-Json -Depth 8 -Compress|Set-Content -LiteralPath $ConfigPath -Encoding UTF8
    }catch{Write-Log ('SAVE ALARM MODE ERROR '+$_.Exception.Message)}
}
function Refresh-AlarmMenu {
    $alarmStrongItem.Checked=$script:alarmMode -eq 'strong'
    $alarmBalancedItem.Checked=$script:alarmMode -eq 'balanced'
    $alarmGentleItem.Checked=$script:alarmMode -eq 'gentle'
    $alarmSilentItem.Checked=$script:alarmMode -eq 'silent'
}
function Set-AlarmMode([string]$mode){
    if(-not ($validAlarmModes -contains $mode)){return}
    Stop-Alarm
    $script:alarmMode=$mode
    $script:lastOneShotKey=''
        Save-AlarmMode $mode
    Refresh-AlarmMenu
    Write-Log ('ALARM MODE '+$mode)
    if($script:pending.Count -gt 0 -and -not $script:webPanelActive){Start-Alarm (($script:pending|ForEach-Object{$_.id}) -join ',')}
}
function Play-SimpleSoundTest([switch]$ShowResult){
    $ok=$false
    try{
        if($script:soundPlayer){$script:soundPlayer.Stop();$script:soundPlayer.PlaySync();$ok=$true}
        else{[System.Media.SystemSounds]::Asterisk.Play();Start-Sleep -Milliseconds 500;$ok=$true}
    }catch{Write-Log ('SIMPLE SOUND TEST ERROR '+$_.Exception.Message)}
    if($ShowResult){
        $text=if($ok){'صدای ساده اجرا شد. اگر آن را شنیدی، خروجی صدای ویندوز و خود Agent سالم است.'}else{'پخش صدای ساده هم ناموفق بود. خروجی صدای Windows و Volume Mixer را بررسی کن.'}
        $icon=if($ok){[System.Windows.Forms.MessageBoxIcon]::Information}else{[System.Windows.Forms.MessageBoxIcon]::Warning}
        [System.Windows.Forms.MessageBox]::Show($text,'PhotoBridge - تست صدا',[System.Windows.Forms.MessageBoxButtons]::OK,$icon)|Out-Null
    }
    return $ok
}
function Start-Alarm([string]$key){
    if($key -eq $script:mutedKey){return}
    switch($script:alarmMode){
        'silent' { Stop-Alarm; return }
        'gentle' {
            Stop-Alarm
            if($key -ne $script:lastOneShotKey){try{[System.Media.SystemSounds]::Asterisk.Play()}catch{};$script:lastOneShotKey=$key}
            return
        }
        'balanced' {
            Stop-Alarm
            if($key -ne $script:lastOneShotKey){try{if($script:soundPlayer){$script:soundPlayer.Play()}else{[System.Media.SystemSounds]::Exclamation.Play()}}catch{};$script:lastOneShotKey=$key}
            return
        }
        default {
            if($script:alarmPlaying){return}
            try{if($script:soundPlayer){$script:soundPlayer.PlayLooping()}else{[System.Media.SystemSounds]::Exclamation.Play()};$script:alarmPlaying=$true}catch{}
        }
    }
}
function Stop-Alarm { try{if($script:soundPlayer){$script:soundPlayer.Stop()}}catch{};$script:alarmPlaying=$false }
function Play-Test {
    switch($script:alarmMode){
        'silent' {[System.Windows.Forms.MessageBox]::Show('حالت هشدار روی «بی‌صدا» است.','PhotoBridge')|Out-Null}
        'gentle' {try{[System.Media.SystemSounds]::Asterisk.Play()}catch{}}
        'balanced' {try{if($script:soundPlayer){$script:soundPlayer.Play()}else{[System.Media.SystemSounds]::Exclamation.Play()}}catch{}}
        default {try{if($script:soundPlayer){$script:soundPlayer.Play()}else{[System.Media.SystemSounds]::Exclamation.Play()}}catch{}}
    }
}
function Update-Panel {
    $rows=New-Object 'System.Collections.Generic.List[PhotoBridgeAlertOrder]'
    foreach($o in $script:pending){
        $row=New-Object PhotoBridgeAlertOrder
        $row.Number=[string]$o.number;$row.Customer=[string]$o.customerName;$row.Files=[string]$o.files;$row.Size=(Format-Bytes ([double]$o.totalBytes));$row.Priority=(Priority-Text ([string]$o.priority))
        $rows.Add($row)
    }
    $count=[int]$script:pending.Count
    $muteLabel=if($script:mutedKey){'صدا قطع شده'}else{'بی‌صدا'}
    $form.SetState($script:labName,$count,$script:webPanelActive,$muteLabel,$rows.ToArray())
    $ackItem.Enabled=$count -gt 0
}
function Poll {
    try {
        $r=Request '/api/print-agent/poll'
        $script:labName=[string]$r.lab.name
        $script:pending=@($r.orders)
        $script:webPanelActive=[bool]$r.webPanelActive
        $count=[int]$r.pendingCount
        Set-Icon $count;Update-Panel
        if($count -gt 0){
            $key=($script:pending|ForEach-Object{$_.id}) -join ','
            if($key -ne $script:lastBalloonKey){$script:mutedKey='';Update-Panel}
            if($script:webPanelActive){
                Stop-Alarm
                if($form.Visible -and -not $script:manualPanelOpen -and (Get-Date) -gt $script:chatDisplayUntil){Hide-Panel}
                $script:lastBalloonKey=$key;$script:lastBalloonAt=[datetime]::MinValue
            } else {
                Start-Alarm $key
                $now=Get-Date
                if($key -ne $script:lastBalloonKey -or ($now-$script:lastBalloonAt).TotalSeconds -gt 60){
                    $first=$script:pending[0]
                    $notify.BalloonTipTitle='سفارش چاپ جدید · PhotoBridge'
                    $notify.BalloonTipText= if($count -eq 1){"سفارش #$($first.number) · $($first.customerName) · $($first.files) فایل"}else{"$count سفارش چاپ در انتظار توجه اپراتور است."}
                    $notify.BalloonTipIcon=[System.Windows.Forms.ToolTipIcon]::Warning
                    $script:lastBalloonTarget='panel'
                    $notify.ShowBalloonTip(10000)
                    $script:lastBalloonKey=$key;$script:lastBalloonAt=$now
                    Show-Panel
                }
            }
        } else {
            Stop-Alarm;$script:lastBalloonKey='';$script:mutedKey=''
            if(-not $script:manualPanelOpen -and (Get-Date) -gt $script:chatDisplayUntil){Hide-Panel}
        }
        $chat=$r.latestChat
        if($null -ne $chat -and [string]$chat.id){
            $chatKey=([string]$chat.source)+'|'+([string]$chat.id)
            $sender=if([string]::IsNullOrWhiteSpace([string]$chat.senderName)){'عکاس'}else{[string]$chat.senderName}
            $message=[string]$chat.message
            $form.SetChatAlert($sender,$message)
            if(-not $script:chatInitialized){$script:lastChatKey=$chatKey;$script:chatInitialized=$true}
            elseif($chatKey -ne $script:lastChatKey){
                $script:lastChatKey=$chatKey
                $script:chatDisplayUntil=(Get-Date).AddSeconds(25)
                try{[System.Media.SystemSounds]::Asterisk.Play()}catch{}
                $notify.BalloonTipTitle='پیام جدید · PhotoBridge'
                $preview=if($message.Length -gt 180){$message.Substring(0,180)+'…'}else{$message}
                $notify.BalloonTipText="$sender : $preview"
                $notify.BalloonTipIcon=[System.Windows.Forms.ToolTipIcon]::Info
                $source=[string]$chat.source
                $senderId=[string]$chat.senderId
                if($source -eq 'platform'){$script:lastChatOpenUrl="$server/lab?pbChat=platform"}
                elseif(-not [string]::IsNullOrWhiteSpace($senderId)){$escaped=[System.Uri]::EscapeDataString($senderId);$script:lastChatOpenUrl="$server/lab?pbChat=customer&contact=$escaped"}
                else{$script:lastChatOpenUrl="$server/lab?pbChat=customer"}
                $script:lastBalloonTarget='chat'
                $notify.ShowBalloonTip(10000)
                $trayText="PhotoBridge - پیام جدید از $sender"
                $notify.Text=if($trayText.Length -gt 63){$trayText.Substring(0,63)}else{$trayText}
                Show-Panel
                Write-Log ('CHAT ALERT '+$chatKey+' sender='+$sender)
            }
        } elseif(-not $script:chatInitialized){$script:chatInitialized=$true}
        $script:lastPollError=''
    } catch {
        Stop-Alarm;$notify.Text='PhotoBridge - اتصال به سرور برقرار نیست';$form.SetDisconnected()
        $msg=[string]$_.Exception.Message;$now=Get-Date
        if($msg -ne $script:lastPollError -or ($now-$script:lastPollErrorAt).TotalMinutes -ge 5){Write-Log ('POLL ERROR '+$msg);$script:lastPollError=$msg;$script:lastPollErrorAt=$now}
    }
}
function Ack-All {
    if($script:pending.Count -le 0){return}
    try { $ids=@($script:pending|ForEach-Object{$_.id}); Request '/api/print-agent/ack' 'POST' @{orderIds=$ids}|Out-Null; $script:pending=@();Stop-Alarm;Set-Icon 0;Update-Panel;if(-not $script:manualPanelOpen){Hide-Panel} } catch { [System.Windows.Forms.MessageBox]::Show('تأیید هشدار روی سرور انجام نشد. اتصال اینترنت را بررسی کنید.','PhotoBridge')|Out-Null }
}
function Mute-Current { if($script:pending.Count -le 0){return};$script:mutedKey=($script:pending|ForEach-Object{$_.id}) -join ',';Stop-Alarm;Update-Panel }
function Get-PhotoBridgeBrowser {
    $candidates=@(
        (Join-Path $env:LOCALAPPDATA 'Google\Chrome\Application\chrome.exe'),
        (Join-Path $env:ProgramFiles 'Google\Chrome\Application\chrome.exe'),
        $(if(${env:ProgramFiles(x86)}){Join-Path ${env:ProgramFiles(x86)} 'Google\Chrome\Application\chrome.exe'}else{$null}),
        (Join-Path $env:ProgramFiles 'Microsoft\Edge\Application\msedge.exe'),
        $(if(${env:ProgramFiles(x86)}){Join-Path ${env:ProgramFiles(x86)} 'Microsoft\Edge\Application\msedge.exe'}else{$null})
    )
    foreach($candidate in $candidates){if($candidate -and (Test-Path -LiteralPath $candidate)){return [string]$candidate}}
    foreach($command in @('chrome.exe','msedge.exe')){try{$resolved=(Get-Command $command -ErrorAction Stop).Source;if($resolved){return [string]$resolved}}catch{}}
    return $null
}
function Open-PhotoBridgeUrl([string]$url) {
    if([string]::IsNullOrWhiteSpace($url)){$url="$server/lab"}
    $browser=Get-PhotoBridgeBrowser
    if(-not $browser){
        Write-Log 'OPEN blocked: Chrome/Edge not found; default browser intentionally not used'
        [System.Windows.Forms.MessageBox]::Show('برای باز کردن پنل PhotoBridge باید Google Chrome یا Microsoft Edge نصب باشد. برای جلوگیری از مشکل ذخیره فایل، Firefox و مرورگر پیش‌فرض عمداً استفاده نمی‌شوند.','PhotoBridge',[System.Windows.Forms.MessageBoxButtons]::OK,[System.Windows.Forms.MessageBoxIcon]::Information)|Out-Null
        return
    }
    try{Write-Log ('OPEN '+$browser+' '+$url);Start-Process -FilePath $browser -ArgumentList @($url)}catch{Write-Log ('OPEN ERROR '+$_.Exception.Message);[System.Windows.Forms.MessageBox]::Show('باز کردن PhotoBridge در Chrome/Edge انجام نشد.','PhotoBridge')|Out-Null}
}
function Open-PhotoBridgePanel { Open-PhotoBridgeUrl "$server/lab" }
function Open-PhotoBridgeChat { Open-PhotoBridgeUrl $script:lastChatOpenUrl }
function Exit-Agent {
    try{$timer.Stop()}catch{};try{$offlineSyncTimer.Stop()}catch{};try{$shutdownTimer.Stop()}catch{};Stop-Alarm;try{$form.Hide()}catch{}
    $trayToDispose=$notify.Icon;$notify.Visible=$false;try{$notify.Icon=$null}catch{};try{$notify.Dispose()}catch{};try{if($null -ne $trayToDispose){$trayToDispose.Dispose()}}catch{}
    try{$form.Dispose()}catch{};try{$script:lockStream.Dispose()}catch{};Remove-Item -LiteralPath $script:readyPath -Force -ErrorAction SilentlyContinue;Remove-Item -LiteralPath $script:shutdownPath -Force -ErrorAction SilentlyContinue
    Write-Log 'EXIT';[System.Windows.Forms.Application]::Exit()
}

$showItem.add_Click({ if($form.Visible){Hide-Panel}else{Show-Panel $true} })
$openItem.add_Click({ Open-PhotoBridgePanel })
$offlineItem.add_Click({
    if (Test-Path -LiteralPath $script:offlineScriptPath) {
        Start-Process -FilePath 'powershell.exe' -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',('"'+$script:offlineScriptPath+'"'))
    } else { [System.Windows.Forms.MessageBox]::Show('بخش آفلاین نصب نشده است. ابزار ویندوز را دوباره نصب کنید.','PhotoBridge')|Out-Null }
})
$ackItem.add_Click({ Ack-All })
$alarmStrongItem.add_Click({ Set-AlarmMode 'strong' })
$alarmBalancedItem.add_Click({ Set-AlarmMode 'balanced' })
$alarmGentleItem.add_Click({ Set-AlarmMode 'gentle' })
$alarmSilentItem.add_Click({ Set-AlarmMode 'silent' })
$testItem.add_Click({ Play-Test })
$soundTestItem.add_Click({ Play-SimpleSoundTest -ShowResult | Out-Null })
$logItem.add_Click({ if(Test-Path $script:logPath){Start-Process notepad.exe -ArgumentList @($script:logPath)} })
$exitItem.add_Click({ Exit-Agent })
$notify.add_MouseClick({ param($sender,$e) if($e.Button -eq [System.Windows.Forms.MouseButtons]::Left){if($form.Visible){Hide-Panel}else{Show-Panel $true}} })
$notify.add_BalloonTipClicked({ if($script:lastBalloonTarget -eq 'chat'){Open-PhotoBridgeChat}else{Show-Panel $true} })
$form.add_AckRequested({ Ack-All })
$form.add_OpenRequested({ Open-PhotoBridgePanel })
$form.add_MuteRequested({ Mute-Current })
$form.add_HideRequested({ Hide-Panel })
Refresh-AlarmMenu

Set-Content -LiteralPath $script:readyPath -Value ((Get-Date).ToString('s')) -Encoding ASCII
Write-Log 'READY tray icon initialized'

$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = 5000
$timer.add_Tick({ Poll })
$timer.Start()
$script:offlineSyncProcess = $null
$offlineSyncTimer = New-Object System.Windows.Forms.Timer
$offlineSyncTimer.Interval = 90000
$offlineSyncTimer.add_Tick({
    try {
        if ($script:offlineSyncProcess -and -not $script:offlineSyncProcess.HasExited) { return }
        if (Test-Path -LiteralPath $script:offlineScriptPath) {
            $script:offlineSyncProcess = Start-Process -FilePath 'powershell.exe' -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-WindowStyle','Hidden','-File',('"'+$script:offlineScriptPath+'"'),'-SyncOnly') -WindowStyle Hidden -PassThru
        }
    } catch { Write-Log ('OFFLINE SYNC ERROR '+$_.Exception.Message) }
})
$offlineSyncTimer.Start()
$shutdownTimer = New-Object System.Windows.Forms.Timer
$shutdownTimer.Interval = 900
$shutdownTimer.add_Tick({ if(Test-Path -LiteralPath $script:shutdownPath){Write-Log 'Shutdown marker received';Exit-Agent} })
$shutdownTimer.Start()
Poll
[System.Windows.Forms.Application]::Run()
