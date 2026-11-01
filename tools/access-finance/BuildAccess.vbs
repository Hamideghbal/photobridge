' PhotoBridge Access Finance prototype - native, read-only forms.
' Creates a NEW .accdb only. Never overwrites an existing file.
Option Explicit
Const acForm=2,acTextBox=109,acLabel=100,acSaveYes=1
Dim app,db,fs,out,folder,launch
Set fs=CreateObject("Scripting.FileSystemObject")
folder=fs.GetParentFolderName(WScript.ScriptFullName)
out=fs.BuildPath(folder,"PhotoBridge_Finance_Review.accdb")
If fs.FileExists(out) Then
 Set launch=CreateObject("WScript.Shell")
 launch.Run Chr(34) & out & Chr(34),1,False
 WScript.Quit 0
End If
On Error Resume Next
Set app=CreateObject("Access.Application")
If Err.Number<>0 Then MsgBox "Microsoft Access is required.",16,"PhotoBridge":WScript.Quit 2
Err.Clear
app.NewCurrentDatabase out
If Err.Number<>0 Then MsgBox "Database creation failed: " & Err.Description,16,"PhotoBridge":app.Quit:WScript.Quit 3
On Error GoTo 0
app.Visible=True
Set db=app.CurrentDb
Function U(hex)
 Dim i,r:r=""
 For i=1 To Len(hex) Step 4:r=r & ChrW(CLng("&H" & Mid(hex,i,4))):Next
 U=r
End Function
Sub Run(sql)
 db.Execute sql,128
End Sub
Sub AddRow(tbl,recordNo,ref,dt,customer,details,kind,amount,mark)
 Run "INSERT INTO [" & tbl & "]([RowNo],[Ref],[DateJ],[Studio],[Details],[Kind],[Amount],[AccountingMark]) VALUES (" & recordNo & ",'" & ref & "','" & dt & "','" & customer & "','" & details & "','" & kind & "'," & amount & ",'" & mark & "')"
End Sub
Sub FormFor(name,title,tbl)
 Dim form,tmp,cols,labels,i,control,head,left,w
 Set form=app.CreateForm
 tmp=form.Name
 form.Caption=U(title)
 form.RecordSource="SELECT [RowNo],[Ref],[DateJ],[Studio],[Details],[Kind],[Amount],[AccountingMark] FROM [" & tbl & "] ORDER BY [RowNo] DESC"
 form.DefaultView=2
 form.AllowEdits=False:form.AllowAdditions=False:form.AllowDeletions=False
 form.RecordSelectors=True:form.NavigationButtons=True:form.DividingLines=True:form.ScrollBars=3
 form.Width=15000
 cols=Array("RowNo","Ref","DateJ","Studio","Details","Kind","Amount","AccountingMark")
 labels=Array("0631062F06CC0641","0631062F06CC0641EF","062A0627063106CC062E","063906A90627063306CC","06340631062D","064606480639","064506280644063A","062B0628062A0020062F06310020062D063306270628062F0627063106CC")
 left=0
 For i=0 To UBound(cols)
  w=1500:If i=4 Then w=2500
  Set control=app.CreateControl(tmp,acTextBox,0,,cols(i),left,0,w,350)
  control.Name="txt"&cols(i):control.Locked=True:control.TabStop=False
  control.FontName="Vazirmatn":control.FontSize=10:control.ColumnWidth=w
  If i=6 Then control.Format="#,##0"
  Set head=app.CreateControl(tmp,acLabel,0,control.Name,,left,0,w,350)
  head.Caption=U(labels(i)):head.FontName="Vazirmatn":head.FontSize=10
  left=left+w
 Next
 app.DoCmd.Close acForm,tmp,acSaveYes
 app.DoCmd.Rename name,acForm,tmp
End Sub
Run "CREATE TABLE [Invoices] ([RowNo] LONG PRIMARY KEY,[Ref] TEXT(60),[DateJ] TEXT(20),[Studio] TEXT(160),[Details] TEXT(255),[Kind] TEXT(60),[Amount] CURRENCY,[AccountingMark] TEXT(40))"
Run "CREATE TABLE [Receipts] ([RowNo] LONG PRIMARY KEY,[Ref] TEXT(60),[DateJ] TEXT(20),[Studio] TEXT(160),[Details] TEXT(255),[Kind] TEXT(60),[Amount] CURRENCY,[AccountingMark] TEXT(40))"
Run "CREATE TABLE [Ledger] ([RowNo] LONG PRIMARY KEY,[Ref] TEXT(60),[DateJ] TEXT(20),[Studio] TEXT(160),[Details] TEXT(255),[Kind] TEXT(60),[Amount] CURRENCY,[AccountingMark] TEXT(40))"
AddRow "Invoices",1,"PB-1001","1405/08/02","Demo Studio A","Online print order","invoice",2400000,"pending"
AddRow "Invoices",2,"PB-1002","1405/08/04","Demo Studio B","Album order","invoice",5800000,"recorded"
AddRow "Invoices",3,"PB-C001","1405/08/05","Demo Studio B","Invoice correction","correction",-250000,"recorded"
AddRow "Receipts",1,"RC-1001","1405/08/03","Demo Studio A","Card payment","card",1200000,"pending"
AddRow "Receipts",2,"RC-1002","1405/08/05","Demo Studio B","Bank transfer","transfer",4000000,"recorded"
AddRow "Receipts",3,"DC-1001","1405/08/05","Demo Studio B","Discount","discount",200000,"pending"
AddRow "Ledger",1,"PB-1001","1405/08/02","Demo Studio A","Invoice debit","debit",2400000,""
AddRow "Ledger",2,"RC-1001","1405/08/03","Demo Studio A","Receipt credit","credit",1200000,""
AddRow "Ledger",3,"PB-1002","1405/08/04","Demo Studio B","Invoice debit","debit",5800000,""
FormFor "frmPBInvoices","0641062706A9062A0648063106470627","Invoices"
FormFor "frmPBReceipts","062F063106CC06270641062A06CC200C06470627","Receipts"
FormFor "frmPBLedger","062D06330627062800200645063906CC0646","Ledger"
app.DoCmd.OpenForm "frmPBInvoices"
MsgBox "PhotoBridge Finance review database created. Forms are read-only.",64,"PhotoBridge"
