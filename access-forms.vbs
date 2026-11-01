Option Explicit
' Native read-only Access workspace. No VBA project access or external macros required.
Const acForm=2, acTextBox=109, acLabel=100, acSubform=112, acTabCtl=123, acImage=103, acSaveYes=1
Dim application, db, target, iconPath, fso
Set fso=CreateObject("Scripting.FileSystemObject")
If WScript.Arguments.Count<1 Then WScript.Echo "missing_db_file":WScript.Quit 2
target=WScript.Arguments(0)
iconPath=""
If WScript.Arguments.Count>1 Then iconPath=WScript.Arguments(1)
On Error Resume Next
Set application=CreateObject("Access.Application")
If Err.Number<>0 Then WScript.Echo "access_not_installed:" & Err.Description:WScript.Quit 4
Err.Clear
application.OpenCurrentDatabase target,False
If Err.Number<>0 Then WScript.Echo "cannot_open_generated_access:" & Err.Description:application.Quit:WScript.Quit 5
On Error GoTo 0
Set db=application.CurrentDb
Function NewForm(title,source,view)
 Dim f
 Set f=application.CreateForm()
 f.Caption=title
 f.RecordSource=source
 f.DefaultView=view
 f.AllowEdits=False
 f.AllowAdditions=False
 f.AllowDeletions=False
 f.RecordSelectors=False
 f.NavigationButtons=True
 f.AutoCenter=True
 f.Width=15000
 f.Section(0).BackColor=RGB(247,249,255)
 f.Section(0).Height=8000
 Set NewForm=f
End Function
Sub Label(f,title,x,y,w,size,color)
 Dim c
 Set c=application.CreateControl(f.Name,acLabel,0,"","",x,y,w,420)
 c.Caption=title:c.FontName="Tahoma":c.FontSize=size:c.ForeColor=color:c.TextAlign=3
End Sub
Function Text(f,source,x,y,w)
 Dim c
 Set c=application.CreateControl(f.Name,acTextBox,0,"",source,x,y,w,360)
 c.FontName="Tahoma":c.FontSize=10:c.TextAlign=3:c.Locked=True
 c.BackColor=RGB(255,255,255):c.BorderColor=RGB(218,226,243)
 Set Text=c
End Function
Sub Finish(f,name)
 Dim temp
 temp=f.Name
 application.DoCmd.Close acForm,temp,acSaveYes
 application.DoCmd.Rename name,acForm,temp
End Sub
Sub Grid(name,title,sql,fields,widths,money)
 Dim f,c,i,x
 Set f=NewForm(title,sql,2)
 f.Section(0).Height=460
 x=14600
 For i=0 To UBound(fields)
  x=x-widths(i)
  Set c=Text(f,"[" & fields(i) & "]",x,60,widths(i)-60)
  If InStr("|" & money & "|","|" & fields(i) & "|")>0 Then c.Format="#,##0.##;[Red](#,##0.##)"
  ' Attached labels become the native Access column captions in datasheet view.
  Dim h
  Set h=application.CreateControl(f.Name,acLabel,0,c.Name,"",x,0,widths(i),300)
  h.Caption=fields(i):h.FontName="Tahoma":h.ForeColor=RGB(48,84,178)
 Next
 f.OrderByOn=False
 Finish f,name
End Sub
Sub Embed(f,source,x,y,w,h,parent,master,child)
 Dim c
 Set c=application.CreateControl(f.Name,acSubform,0,parent,"",x,y,w,h)
 c.SourceObject="Form." & source
 If master<>"" Then c.LinkMasterFields=master:c.LinkChildFields=child
End Sub
Sub BuildWorkspace()
 Dim f,c,tabs,page,temp,prop,checkForm,fieldCount
 Grid "ردیف فاکتور","ردیف‌های فاکتور","SELECT * FROM [ردیف‌های فاکتور] ORDER BY [ردیف]",Array("ردیف","شرح","تعداد","قیمت واحد","مبلغ ردیف"),Array(700,6500,1400,2700,2700),"قیمت واحد|مبلغ ردیف"
 Grid "گردش معین","گردش معین","SELECT e.[شناسه مشتری],h.[تاریخ],h.[شرح],e.[حساب],e.[بدهکار],e.[بستانکار],e.[شناسه فاکتور] FROM [دفتر حسابداری] AS h INNER JOIN [ردیف‌های حسابداری] AS e ON h.[شناسه سند حسابداری]=e.[شناسه سند حسابداری] ORDER BY h.[تاریخ],h.[شناسه سند حسابداری],e.[ردیف]",Array("تاریخ","شرح","حساب","بدهکار","بستانکار"),Array(2600,5500,2300,1800,1800),"بدهکار|بستانکار"
 Grid "frmPBReceipts","دریافت‌ها","SELECT * FROM [دریافت‌ها] ORDER BY [تاریخ دریافت] DESC",Array("تاریخ دریافت","روش پرداخت","مبلغ","توضیحات"),Array(3000,2000,2500,6500),"مبلغ"
 Set f=NewForm("فاکتورها","SELECT * FROM [فاکتورها] ORDER BY [تاریخ صدور] DESC,[شماره فاکتور] DESC",0)
 Label f,"فاکتورها · نسخهٔ پشتیبان مالی",700,180,13600,18,RGB(48,84,178)
 Label f,"شماره فاکتور",11500,800,2700,10,RGB(83,99,126)
 Set c=Text(f,"[شماره فاکتور]",11500,1250,2700)
 Label f,"نام مشتری",6200,800,5000,10,RGB(83,99,126)
 Set c=Text(f,"[نام مشتری]",6200,1250,5000)
 Label f,"تاریخ صدور / منشأ",700,800,5200,10,RGB(83,99,126)
 Set c=Text(f,"[تاریخ صدور]",2500,1250,3400)
 Set c=Text(f,"[منشأ فاکتور]",700,1250,1700)
 Embed f,"ردیف فاکتور",700,1900,13600,3300,"","شناسه فاکتور","شناسه فاکتور"
 Label f,"مبلغ کل (تومان)",10300,5400,3900,10,RGB(83,99,126)
 Set c=Text(f,"[مبلغ کل]",10300,5850,3900):c.Format="#,##0.##"
 Label f,"دریافت‌شده (تومان)",5500,5400,4300,10,RGB(83,99,126)
 Set c=Text(f,"[مبلغ دریافت‌شده]",5500,5850,4300):c.Format="#,##0.##"
 Label f,"مانده (تومان)",700,5400,4300,10,RGB(83,99,126)
 Set c=Text(f,"[مانده حساب]",700,5850,4300):c.Format="#,##0.##;[Red](#,##0.##)"
 Set c=Text(f,"[توضیحات]",700,6500,13600)
 Finish f,"frmPBInvoices"
 Set f=NewForm("معین مشتریان","SELECT * FROM [مانده مشتریان] ORDER BY [نام مشتری]",0)
 Label f,"معین مشتریان · گردش حساب",700,180,13600,18,RGB(48,84,178)
 Label f,"مشتری",7000,800,7200,10,RGB(83,99,126)
 Set c=Text(f,"[نام مشتری]",7000,1250,7200)
 Set c=Text(f,"[تلفن همراه]",700,1250,6000)
 Embed f,"گردش معین",700,1900,13600,3300,"","شناسه مشتری","شناسه مشتری"
 Label f,"جمع فاکتورها (تومان)",10300,5400,3900,10,RGB(83,99,126)
 Set c=Text(f,"[جمع فاکتورها]",10300,5850,3900):c.Format="#,##0.##"
 Label f,"جمع دریافت (تومان)",5500,5400,4300,10,RGB(83,99,126)
 Set c=Text(f,"[مبلغ دریافت‌شده]",5500,5850,4300):c.Format="#,##0.##"
 Label f,"مانده حساب (تومان)",700,5400,4300,10,RGB(83,99,126)
 Set c=Text(f,"[مانده حساب]",700,5850,4300):c.Format="#,##0.##;[Red](#,##0.##)"
 Label f,"انتخاب مشتری: نوار رکورد پایین فرم | جست‌وجو و فیلتر: ابزارهای استاندارد Access",700,6700,13600,10,RGB(83,99,126)
 Finish f,"frmPBLedger"
 Set f=NewForm("PhotoBridge | پشتیبان امور مالی","",0)
 f.NavigationButtons=False
 f.Section(0).Height=10000
 Label f,"PhotoBridge · امور مالی لابراتوار",1600,180,12600,20,RGB(48,84,178)
 Label f,"نسخهٔ ثابت بکاپ · فقط مشاهده · مبالغ به تومان · بدون کپی عکس و PDF",700,800,13600,10,RGB(83,99,126)
 If iconPath<>"" Then
  Set c=application.CreateControl(f.Name,acImage,0,"","",700,180,700,600)
  c.PictureType=0:c.Picture=iconPath:c.SizeMode=3
 End If
 Set tabs=application.CreateControl(f.Name,acTabCtl,0,"","",350,1450,14300,8000)
 tabs.FontName="Tahoma":tabs.FontSize=12
 Set page=tabs.Pages(0):page.Caption="فاکتورها"
 Embed f,"frmPBInvoices",500,2000,14000,7200,page.Name,"",""
 Set page=tabs.Pages(1):page.Caption="معین مشتریان"
 Embed f,"frmPBLedger",500,2000,14000,7200,page.Name,"",""
 Set page=tabs.Pages.Add:page.Caption="دریافت‌ها"
 Embed f,"frmPBReceipts",500,2000,14000,7200,page.Name,"",""
 Finish f,"خانه فوتوبریج"
 Set prop=db.CreateProperty("StartupForm",10,"خانه فوتوبریج")
 db.Properties.Append prop
 ' Confirm persisted form objects, not just the table rows.
 For Each temp In Array("خانه فوتوبریج","frmPBInvoices","frmPBLedger","ردیف فاکتور","گردش معین","frmPBReceipts")
  If application.CurrentProject.AllForms(temp).Name<>temp Then Err.Raise 513,,"missing_form:" & temp
  application.DoCmd.OpenForm temp,0
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
