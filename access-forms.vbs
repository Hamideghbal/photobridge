Option Explicit
' PhotoBridge native Access forms: runs only on a freshly generated data-only copy.
Const acForm=2, acTextBox=109, acLabel=100, acSaveYes=1
Dim application, db, target, fso
Set fso=CreateObject("Scripting.FileSystemObject")
If WScript.Arguments.Count<>1 Then WScript.Echo "missing_db_file":WScript.Quit 2
target=WScript.Arguments(0)
If Not fso.FileExists(target) Then WScript.Echo "db_file_missing":WScript.Quit 3
On Error Resume Next
Set application=CreateObject("Access.Application")
If Err.Number<>0 Then WScript.Echo "access_not_installed":WScript.Quit 4
Err.Clear
application.OpenCurrentDatabase target,False
If Err.Number<>0 Then
 WScript.Echo "cannot_open_generated_access"
 application.Quit
 WScript.Quit 5
End If
On Error GoTo 0
Set db=application.CurrentDb
Sub AddViewer(viewName,viewCaption,recordSource,fields)
 Dim frm,temp,i,fieldName,ctl,caption,leftPos,width
 Set frm=application.CreateForm()
 temp=frm.Name
 frm.Caption=viewCaption
 frm.RecordSource=recordSource
 frm.DefaultView=2
 frm.AllowEdits=False
 frm.AllowAdditions=False
 frm.AllowDeletions=False
 frm.RecordSelectors=True
 frm.NavigationButtons=True
 frm.DividingLines=True
 leftPos=0
 For i=0 To UBound(fields)
  fieldName=fields(i)
  width=2100
  If fieldName="شرح" Or fieldName="نام مشتری" Then width=3000
  Set ctl=application.CreateControl(temp,acTextBox,0,"","[" & fieldName & "]",leftPos,0,width,320)
  ctl.Name="pbColumn" & CStr(i)
  ctl.Locked=True
  ctl.TabStop=False
  ctl.FontName="Tahoma"
  ctl.FontSize=10
  ctl.ColumnWidth=width
  Set caption=application.CreateControl(temp,acLabel,0,ctl.Name,"",leftPos,0,width,300)
  caption.Caption=fieldName
  caption.FontName="Tahoma"
  caption.FontSize=10
  leftPos=leftPos+width
 Next
 frm.Width=leftPos+400
 application.DoCmd.Close acForm,temp,acSaveYes
 application.DoCmd.Rename viewName,acForm,temp
End Sub
On Error Resume Next
AddViewer "frmPBInvoices","فاکتورها","SELECT * FROM [فاکتورها]",Array("شماره فاکتور","تاریخ صدور","نام مشتری","مبلغ کل","مبلغ دریافت‌شده","مانده حساب")
If Err.Number<>0 Then WScript.Echo "invoice_form_failed:" & Err.Number:application.Quit:WScript.Quit 6
AddViewer "frmPBReceipts","دریافت‌ها","SELECT * FROM [دریافت‌ها]",Array("شناسه دریافت","شناسه فاکتور","شناسه مشتری","روش پرداخت","تاریخ دریافت","مبلغ")
If Err.Number<>0 Then WScript.Echo "receipts_form_failed:" & Err.Number:application.Quit:WScript.Quit 7
AddViewer "frmPBLedger","حساب معین","SELECT h.[شناسه سند حسابداری] AS [شماره سند],h.[تاریخ],h.[شرح],e.[حساب],e.[شناسه مشتری],e.[بدهکار],e.[بستانکار] FROM [دفتر حسابداری] AS h INNER JOIN [ردیف‌های حسابداری] AS e ON h.[شناسه سند حسابداری]=e.[شناسه سند حسابداری]",Array("شماره سند","تاریخ","شرح","حساب","شناسه مشتری","بدهکار","بستانکار")
If Err.Number<>0 Then WScript.Echo "ledger_form_failed:" & Err.Number:application.Quit:WScript.Quit 8
Err.Clear
application.CloseCurrentDatabase
application.Quit
If Err.Number<>0 Then WScript.Echo "access_close_failed":WScript.Quit 9
WScript.Echo "forms_created"
