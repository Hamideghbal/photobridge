Option Explicit
' Flat read-only native Access screens; no VBA code or external macros.
Const acForm=2, acTextBox=109, acLabel=100, acSaveYes=1
Dim application, db, target, fso
Set fso=CreateObject("Scripting.FileSystemObject")
If WScript.Arguments.Count<1 Then WScript.Echo "missing_db_file":WScript.Quit 2
target=WScript.Arguments(0)
On Error Resume Next
Set application=CreateObject("Access.Application")
If Err.Number<>0 Then WScript.Echo "access_not_installed:" & Err.Description:WScript.Quit 4
Err.Clear
application.OpenCurrentDatabase target,False
If Err.Number<>0 Then WScript.Echo "cannot_open_generated_access:" & Err.Description:application.Quit:WScript.Quit 5
On Error GoTo 0
Set db=application.CurrentDb
Sub StyleSheet(f)
 ' Cosmetic properties differ between Access versions; data binding failures are never ignored.
 On Error Resume Next
 f.Orientation=1
 f.DatasheetFontName="Tahoma"
 f.DatasheetFontHeight=11
 f.DatasheetForeColor=RGB(38,52,77)
 f.DatasheetBackColor=RGB(255,255,255)
 f.DatasheetAlternateBackColor=RGB(241,245,255)
 f.DatasheetGridlinesColor=RGB(222,230,244)
 On Error GoTo 0
End Sub
Sub Setting(name,kind,value)
 Dim prop,code,detail
 On Error Resume Next
 db.Properties(name)=value
 code=Err.Number:detail=Err.Description
 Err.Clear
 On Error GoTo 0
 If code=3270 Then
  Set prop=db.CreateProperty(name,kind,value)
  db.Properties.Append prop
 ElseIf code<>0 Then
  Err.Raise code,,detail
 End If
End Sub
Sub Grid(name,title,sql,fields,widths,money)
 Dim f,c,h,i,x,temp
 Set f=application.CreateForm()
 f.Caption=title
 f.RecordSource=sql
 f.DefaultView=2
 f.AllowEdits=False
 f.AllowAdditions=False
 f.AllowDeletions=False
 f.AllowFilters=True
 f.RecordSelectors=True
 f.NavigationButtons=True
 f.Width=15000
 f.Section(0).Height=480
 StyleSheet f
 x=0
 For i=0 To UBound(fields)
  Set c=application.CreateControl(f.Name,acTextBox,0,"","[" & fields(i) & "]",x,60,widths(i)-60,360)
  c.Name="pbColumn" & CStr(i)
  c.FontName="Tahoma":c.FontSize=11:c.TextAlign=3
  c.Locked=True:c.TabStop=True:c.TabIndex=i
  c.ColumnWidth=widths(i):c.ColumnOrder=i+1
  If InStr("|" & money & "|","|" & fields(i) & "|")>0 Then c.Format="#,##0.##;[Red](#,##0.##)"
  Set h=application.CreateControl(f.Name,acLabel,0,c.Name,"",x,0,widths(i),300)
  h.Caption=fields(i):h.FontName="Tahoma":h.FontSize=11
  x=x+widths(i)
 Next
 temp=f.Name
 application.DoCmd.Close acForm,temp,acSaveYes
 application.DoCmd.Rename name,acForm,temp
End Sub
Sub HomeLink(f,title,screen,y)
 Dim c
 Set c=application.CreateControl(f.Name,acLabel,0,"","",600,y,10800,650)
 c.Caption=title:c.FontName="Tahoma":c.FontSize=14:c.TextAlign=3
 c.BackStyle=1:c.BackColor=RGB(234,240,255):c.ForeColor=RGB(49,94,251)
 c.HyperlinkSubAddress="Form " & screen
 c.ControlTipText="باز کردن " & screen & " در صفحهٔ مستقل"
End Sub
Sub Home()
 Dim f,c,temp
 Set f=application.CreateForm()
 f.Caption="PhotoBridge | پشتیبان امور مالی"
 f.DefaultView=0:f.Width=12000:f.Section(0).Height=6100
 f.NavigationButtons=False:f.RecordSelectors=False
 f.Section(0).BackColor=RGB(247,249,255)
 Set c=application.CreateControl(f.Name,acLabel,0,"","",600,300,10800,650)
 c.Caption="PhotoBridge · پشتیبان امور مالی":c.FontName="Tahoma":c.FontSize=22:c.TextAlign=3:c.ForeColor=RGB(38,52,77)
 Set c=application.CreateControl(f.Name,acLabel,0,"","",600,1000,10800,450)
 c.Caption="برای مشاهده، یک بخش را انتخاب کنید. همهٔ مبالغ به تومان است.":c.FontName="Tahoma":c.FontSize=11:c.TextAlign=3
 HomeLink f,"فاکتورها  |  شماره، مشتری، مبلغ و مانده","فاکتورها",1700
 HomeLink f,"معین مشتریان  |  گردش بدهکار و بستانکار","معین مشتریان",2550
 HomeLink f,"مانده مشتریان  |  جمع فروش، دریافت و مانده","مانده مشتریان",3400
 HomeLink f,"ردیف‌های فاکتور  |  شرح، تعداد و قیمت","ردیف‌های فاکتور",4250
 Set c=application.CreateControl(f.Name,acLabel,0,"","",600,5200,10800,650)
 c.Caption="برای جست‌وجو و فیلتر از ابزارهای Access استفاده کنید. این فایل نسخهٔ ثابتِ لحظهٔ بکاپ است.":c.FontName="Tahoma":c.FontSize=10:c.TextAlign=3:c.ForeColor=RGB(105,121,148)
 temp=f.Name
 application.DoCmd.Close acForm,temp,acSaveYes
 application.DoCmd.Rename "شروع",acForm,temp
End Sub
Sub BuildWorkspace()
 Dim temp,checkForm,fieldCount
 ' Each screen is a top-level native document: no embedded forms or nested scroll panes.
 Grid "فاکتورها","فاکتورها | PhotoBridge · تومان","SELECT * FROM [فاکتورها] ORDER BY [تاریخ صدور] DESC,[شماره فاکتور] DESC",Array("شماره فاکتور","نام مشتری","تاریخ صدور","منشأ فاکتور","مبلغ کل","مبلغ دریافت‌شده","مانده حساب"),Array(1500,3000,2800,1200,1800,1800,1800),"مبلغ کل|مبلغ دریافت‌شده|مانده حساب"
 Grid "معین مشتریان","معین مشتریان | PhotoBridge · تومان","SELECT c.[نام مشتری],h.[تاریخ],h.[شرح],e.[حساب],i.[شماره فاکتور],e.[بدهکار],e.[بستانکار] FROM (([دفتر حسابداری] AS h INNER JOIN [ردیف‌های حسابداری] AS e ON h.[شناسه سند حسابداری]=e.[شناسه سند حسابداری]) LEFT JOIN [مانده مشتریان] AS c ON e.[شناسه مشتری]=c.[شناسه مشتری]) LEFT JOIN [فاکتورها] AS i ON e.[شناسه فاکتور]=i.[شناسه فاکتور] WHERE e.[شناسه مشتری] Is Not Null AND e.[شناسه مشتری]<>'' ORDER BY c.[نام مشتری],h.[تاریخ],h.[شناسه سند حسابداری],e.[ردیف]",Array("نام مشتری","تاریخ","شرح","حساب","شماره فاکتور","بدهکار","بستانکار"),Array(2500,2500,3500,1600,1400,1700,1700),"بدهکار|بستانکار"
 Grid "مانده مشتریان","مانده مشتریان | PhotoBridge · تومان","SELECT * FROM [مانده مشتریان] ORDER BY [نام مشتری]",Array("نام مشتری","تلفن همراه","جمع فاکتورها","مبلغ دریافت‌شده","مانده حساب"),Array(3500,2500,2600,2600,2600),"جمع فاکتورها|مبلغ دریافت‌شده|مانده حساب"
 Grid "ردیف‌های فاکتور","ردیف‌های فاکتور | PhotoBridge · تومان","SELECT i.[شماره فاکتور],i.[نام مشتری],l.[ردیف],l.[شرح],l.[تعداد],l.[قیمت واحد],l.[مبلغ ردیف] FROM [فاکتورها] AS i INNER JOIN [ردیف‌های فاکتور] AS l ON i.[شناسه فاکتور]=l.[شناسه فاکتور] ORDER BY i.[تاریخ صدور] DESC,i.[شماره فاکتور],l.[ردیف]",Array("شماره فاکتور","نام مشتری","ردیف","شرح","تعداد","قیمت واحد","مبلغ ردیف"),Array(1500,2300,700,4800,900,1700,1700),"قیمت واحد|مبلغ ردیف"
 Home
 Setting "StartupForm",10,"شروع"
 Setting "StartupShowDBWindow",1,True
 Setting "UseMDIMode",4,0
 Setting "ShowDocumentTabs",1,True
 Setting "AppTitle",10,"PhotoBridge | پشتیبان امور مالی"
 ' Open saved screens in their actual datasheet view and force query evaluation.
 For Each temp In Array("شروع","فاکتورها","معین مشتریان","مانده مشتریان","ردیف‌های فاکتور")
  If application.CurrentProject.AllForms(temp).Name<>temp Then Err.Raise 513,,"missing_form:" & temp
  If temp="شروع" Then
   application.DoCmd.OpenForm temp,0
  Else
   application.DoCmd.OpenForm temp,3
  End If
  Set checkForm=application.Forms(temp)
  If checkForm.RecordSource<>"" Then
   fieldCount=checkForm.RecordsetClone.Fields.Count
   If fieldCount=0 Then Err.Raise 514,,"empty_record_source:" & temp
  End If
  application.DoCmd.Close acForm,temp,2
 Next
End Sub
On Error Resume Next
BuildWorkspace
If Err.Number<>0 Then
 WScript.Echo "access_form_build_failed:" & Err.Number & ":" & Err.Description
 application.Quit
 WScript.Quit 6
End If
Err.Clear
application.CloseCurrentDatabase
application.Quit
If Err.Number<>0 Then WScript.Echo "access_close_failed:" & Err.Description:WScript.Quit 9
WScript.Echo "forms_created"
