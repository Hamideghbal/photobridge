Option Explicit
' Read-only Access REPORTS. The sole form is an unbound report launcher.
Const acForm=2, acReport=3, acTextBox=109, acLabel=100, acSaveYes=1
Dim application, db, target, fso, ownerFile, ownerScript, shell, command, code
Set fso=CreateObject("Scripting.FileSystemObject")
If WScript.Arguments.Count<1 Then WScript.Echo "missing_db_file":WScript.Quit 2
target=WScript.Arguments(0)
If WScript.Arguments.Count<3 Then WScript.Echo "missing_worker_owner":WScript.Quit 3
ownerFile=WScript.Arguments(1):ownerScript=WScript.Arguments(2)
Sub Stage(value)
 Dim log
 Set log=fso.OpenTextFile(ownerFile & ".progress",2,True,-1)
 log.Write value:log.Close
End Sub
Stage "create_access"
On Error Resume Next
Set application=CreateObject("Access.Application")
If Err.Number<>0 Then WScript.Echo "access_not_installed:" & Err.Description:WScript.Quit 4
Err.Clear
Set shell=CreateObject("WScript.Shell")
command="powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File " & Chr(34) & ownerScript & Chr(34) & " -Action Record -OwnerFile " & Chr(34) & ownerFile & Chr(34) & " -WindowHandle " & CStr(application.hWndAccessApp)
code=shell.Run(command,0,True)
If Err.Number<>0 Or code<>0 Then WScript.Echo "access_instance_not_owned":WScript.Quit 7
Stage "open_database"
application.OpenCurrentDatabase target,False
If Err.Number<>0 Then WScript.Echo "cannot_open_generated_access:" & Err.Description:application.Quit:WScript.Quit 5
On Error GoTo 0
Set db=application.CurrentDb
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
Function PersianDigits(expression)
 Dim result,i,q
 q=Chr(34):result=expression
 If Left(result,1)="=" Then result=Mid(result,2)
 For i=0 To 9
  result="Replace(" & result & "," & q & CStr(i) & q & "," & q & Mid("۰۱۲۳۴۵۶۷۸۹",i+1,1) & q & ")"
 Next
 PersianDigits="=" & result
End Function
Function PersianMoney(expression)
 Dim q,value,whole,fraction
 q=Chr(34)
 If Left(expression,1)="=" Then expression=Mid(expression,2)
 value="Nz(" & expression & ",0)"
 whole="Format(" & value & "," & q & "#,##0;(#,##0);0" & q & ")"
 fraction="Format(" & value & "," & q & "#,##0.####;(#,##0.####);0" & q & ")"
 PersianMoney=PersianDigits("IIf(" & value & "=Fix(" & value & ")," & whole & "," & fraction & ")")
End Function
Sub Label(report,section,title,x,y,w,size)
 Dim c
 Set c=application.CreateReportControl(report.Name,acLabel,section,"","",x,y,w,420)
 If title="تاریخ نمایشی" Then title="تاریخ"
 c.Caption=title:c.FontName="Tahoma":c.FontSize=size:c.TextAlign=3:c.ForeColor=RGB(49,80,148)
End Sub
Function Value(report,section,source,x,y,w,money)
 Dim c
 Set c=application.CreateReportControl(report.Name,acTextBox,section,"",source,x,y,w,460)
 c.FontName="Tahoma":c.FontSize=11:c.TextAlign=3:c.BorderStyle=0
 c.CanGrow=Not money
 If money Then
  c.ControlSource=PersianMoney(source)
  c.ReadingOrder=1
 ElseIf source="[شماره فاکتور]" Or InStr(source,"[Page]")>0 Then
  c.ControlSource=PersianDigits(source)
 End If
 Set Value=c
End Function
Sub PageStyle(r)
 ' Printing preferences alone may be unavailable on a machine without a printer.
 On Error Resume Next
 r.Printer.PaperSize=9:r.Printer.Orientation=2
 r.Printer.LeftMargin=432:r.Printer.RightMargin=432
 r.Printer.TopMargin=500:r.Printer.BottomMargin=500
 r.Orientation=1
 On Error GoTo 0
End Sub
Sub GroupedReport(name,title,sql,groupField,groupTitle,fields,widths,money,totals,totalLabels,opening,sortField)
 Dim r,temp,level,i,x,c,rs,sortLevel
 Stage "query: " & name
 Set rs=db.OpenRecordset(sql)
 If rs.Fields.Count=0 Then Err.Raise 514,,"empty_query:" & name
 rs.Close
 Stage "create_report: " & name
 Set r=application.CreateReport()
 temp=r.Name:r.Caption=title:r.RecordSource=sql:r.Width=15000
 PageStyle r
 level=application.CreateGroupLevel(temp,"[" & groupField & "]",True,True)
 r.GroupLevel(level).SortOrder=False
 sortLevel=application.CreateGroupLevel(temp,"[" & sortField & "]",False,False)
 r.GroupLevel(sortLevel).SortOrder=False
 r.Section(3).Height=1720
 r.Section(0).Height=600:r.Section(0).CanGrow=True
 r.Section(5+level*2).Height=1000:r.Section(5+level*2).RepeatSection=True
 r.Section(6+level*2).Height=1500:r.Section(6+level*2).KeepTogether=True
 r.Section(5+level*2).BackColor=RGB(234,240,255)
 r.Section(6+level*2).BackColor=RGB(241,245,255)
 Label r,3,title,100,80,14800,17
 Label r,3,"PhotoBridge | مبالغ به تومان | اعداد داخل پرانتز، منفی هستند | داده‌های لحظهٔ بکاپ",100,650,14800,10
 x=14800
 For i=0 To UBound(fields)
  x=x-widths(i)
  Label r,3,fields(i),x,1250,widths(i)-40,10
  Set c=Value(r,0,"[" & fields(i) & "]",x,30,widths(i)-40,InStr("|" & money & "|","|" & fields(i) & "|")>0)
 Next
 Set c=Value(r,5+level*2,groupTitle,100,80,14700,False):c.FontSize=14
 If groupField="کلید گروه" Then
  Set c=Value(r,5+level*2,"[تلفن همراه]",100,530,3200,False)
 End If
 If opening Then
  Label r,5+level*2,"مانده آغازین گردش:",7000,530,3300,10
  Set c=Value(r,5+level*2,"[مانده آغازین]",3500,530,3300,True)
 End If
 For i=0 To UBound(totals)
  x=14800-(i+1)*Int(14800/(UBound(totals)+1))
  Label r,6+level*2,totalLabels(i),x,100,Int(14800/(UBound(totals)+1))-70,10
  Set c=Value(r,6+level*2,totals(i),x,650,Int(14800/(UBound(totals)+1))-70,True):c.FontBold=True
 Next
 r.Section(4).Height=500
 Set c=Value(r,4,"=""صفحه "" & [Page] & "" از "" & [Pages]",100,40,14800,False)
 application.DoCmd.Close acReport,temp,acSaveYes
 application.DoCmd.Rename name,acReport,temp
End Sub
Sub HomeLink(f,title,screen,y)
 Dim c
 Set c=application.CreateControl(f.Name,acLabel,0,"","",600,y,10800,700)
 c.Caption=title:c.FontName="Tahoma":c.FontSize=14:c.TextAlign=3
 c.BackStyle=1:c.BackColor=RGB(234,240,255):c.ForeColor=RGB(49,94,251)
 c.HyperlinkSubAddress="Report " & screen
 c.ControlTipText="مشاهدهٔ گزارش " & screen
End Sub
Sub Home()
 Dim f,c,temp
 Set f=application.CreateForm()
 f.Caption="PhotoBridge | گزارش‌های مالی"
 f.DefaultView=0:f.Width=12000:f.Section(0).Height=5700
 f.AllowEdits=False:f.AllowAdditions=False:f.AllowDeletions=False
 f.NavigationButtons=False:f.RecordSelectors=False
 f.Section(0).BackColor=RGB(247,249,255)
 Set c=application.CreateControl(f.Name,acLabel,0,"","",600,300,10800,650)
 c.Caption="PhotoBridge · گزارش‌های مالی":c.FontName="Tahoma":c.FontSize=22:c.TextAlign=3
 Set c=application.CreateControl(f.Name,acLabel,0,"","",600,1050,10800,600)
 c.Caption="فقط مشاهده و چاپ؛ برای باز کردن گزارش، عنوان آن را انتخاب کنید.":c.FontName="Tahoma":c.FontSize=11:c.TextAlign=3
 HomeLink f,"معین آتلیه‌ها  |  گردش و ماندهٔ هر آتلیه","معین آتلیه‌ها",1900
 HomeLink f,"فاکتورهای آتلیه‌ها  |  فاکتورها و جمع هر آتلیه","فاکتورهای آتلیه‌ها",2800
 HomeLink f,"خلاصه بدهی آتلیه‌ها  |  مجموع بدهی و بستانکاری","خلاصه بدهی آتلیه‌ها",3700
 Set c=application.CreateControl(f.Name,acLabel,0,"","",600,4700,10800,800)
 c.Caption="گزارش‌ها در بخش Reports اکسس نیز در دسترس‌اند. برای انتخاب آتلیه، گزارش را در Report View باز کنید و روی نام آتلیه راست‌کلیک و فیلتر کنید. فایل مربوط به لحظهٔ بکاپ است.":c.FontName="Tahoma":c.FontSize=10:c.TextAlign=3
 temp=f.Name
 application.DoCmd.Close acForm,temp,acSaveYes
 application.DoCmd.Rename "گزارش‌های مالی",acForm,temp
End Sub
Sub BuildReports()
 Dim name,check
 GroupedReport "معین آتلیه‌ها","معین به تفکیک آتلیه","SELECT * FROM [گردش معین آتلیه‌ها] ORDER BY [کلید گروه],[ردیف]","کلید گروه","[نام آتلیه]",Array("تاریخ نمایشی","شماره فاکتور","شرح","بدهکار","بستانکار","مانده گردش"),Array(2000,1600,4300,2200,2200,2200),"بدهکار|بستانکار|مانده گردش",Array("=Sum([بدهکار])","=Sum([بستانکار])","=First([مانده پایان گردش])","=First([مانده فعلی حساب])"),Array("جمع بدهکار","جمع بستانکار","مانده پایان گردش","مانده فعلی حساب"),True,"ردیف"
 GroupedReport "فاکتورهای آتلیه‌ها","فاکتورها به تفکیک آتلیه","SELECT i.*,s.[تلفن همراه],i.[نام مشتری] AS [نام آتلیه],Left(i.[نام مشتری],180) & '|' & IIf(i.[شناسه مشتری]='',i.[شناسه فاکتور],i.[شناسه مشتری]) AS [کلید گروه],(i.[مبلغ کل]+i.[مبلغ اصلاحیه]) AS [مبلغ نهایی] FROM [فاکتورها] AS i LEFT JOIN [خلاصه حساب آتلیه‌ها] AS s ON i.[شناسه مشتری]=s.[شناسه مشتری] ORDER BY i.[نام مشتری],i.[شناسه مشتری],i.[تاریخ صدور],i.[شماره فاکتور]","کلید گروه","[نام آتلیه]",Array("تاریخ نمایشی","شماره فاکتور","منشأ فاکتور","مبلغ نهایی","مبلغ دریافت‌شده","مانده حساب"),Array(2200,1800,1500,3000,3000,3000),"مبلغ نهایی|مبلغ دریافت‌شده|مانده حساب",Array("=Sum([مبلغ نهایی])","=Sum([مبلغ دریافت‌شده])","=Sum([مانده حساب])"),Array("جمع فاکتورها با اصلاحیه","جمع دریافت فاکتورها","مانده فاکتورها"),False,"تاریخ صدور"
 GroupedReport "خلاصه بدهی آتلیه‌ها","خلاصه بدهی و بستانکاری آتلیه‌ها","SELECT s.*,'همه آتلیه‌ها' AS [گروه گزارش] FROM [خلاصه حساب آتلیه‌ها] AS s ORDER BY s.[نام آتلیه],s.[شناسه مشتری]","گروه گزارش","[گروه گزارش]",Array("نام آتلیه","تلفن همراه","بدهی","بستانکاری","مانده فعلی حساب"),Array(4200,3000,2500,2500,2300),"بدهی|بستانکاری|مانده فعلی حساب",Array("=Sum([بدهی])","=Sum([بستانکاری])","=Sum([مانده فعلی حساب])"),Array("مجموع بدهی آتلیه‌ها","مجموع بستانکاری","مانده خالص"),False,"نام آتلیه"
 Home
 Setting "StartupForm",10,"گزارش‌های مالی"
 Setting "StartupShowDBWindow",1,True
 Setting "UseMDIMode",4,0
 Setting "ShowDocumentTabs",1,True
 Setting "AppTitle",10,"PhotoBridge | گزارش‌های مالی"
 For Each name In Array("معین آتلیه‌ها","فاکتورهای آتلیه‌ها","خلاصه بدهی آتلیه‌ها")
  If application.CurrentProject.AllReports(name).Name<>name Then Err.Raise 513,,"missing_report:" & name
  ' The SQL is already validated noninteractively via db.OpenRecordset(sql)
  ' inside GroupedReport. Opening the report here resolves Access text-box
  ' and sort expressions, which can display the modal "Enter Parameter: تاریخ"
  ' dialog and block an unattended Windows backup. Never open a report while
  ' generating a backup; the saved reports remain available for manual viewing.
  Stage "validate_saved_report: " & name
  If application.CurrentProject.AllReports(name).Name<>name Then Err.Raise 513,,"missing_report:" & name
 Next
End Sub
On Error Resume Next
BuildReports
If Err.Number<>0 Then
 WScript.Echo "access_report_build_failed:" & Err.Number & ":" & Err.Description
 application.Quit 2
 WScript.Quit 6
End If
Err.Clear
Stage "close_access"
application.CloseCurrentDatabase
application.Quit
If Err.Number<>0 Then WScript.Echo "access_close_failed:" & Err.Description:WScript.Quit 9
WScript.Echo "reports_created"
