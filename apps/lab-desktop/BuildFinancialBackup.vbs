' PhotoBridge Windows financial view. Creates an Access file with native read-only forms.
' Input: BuildFinancialBackup.vbs <directory with Invoices.tsv,Receipts.tsv,Ledger.tsv> <new .accdb path>
Option Explicit
Const acForm=2, acTextBox=109, acLabel=100, acSaveYes=1
Dim fs, app, db, inputDir, outputFile, cols, labels
Set fs=CreateObject("Scripting.FileSystemObject")
If WScript.Arguments.Count<>2 Then WScript.Echo "usage: dataDir output.accdb":WScript.Quit 2
inputDir=WScript.Arguments(0):outputFile=WScript.Arguments(1)
If fs.FileExists(outputFile) Then WScript.Echo "output_exists":WScript.Quit 3
If Not fs.FolderExists(inputDir) Then WScript.Echo "missing_data_folder":WScript.Quit 4
If Not fs.FileExists(fs.BuildPath(inputDir,"Invoices.tsv")) Or Not fs.FileExists(fs.BuildPath(inputDir,"Receipts.tsv")) Or Not fs.FileExists(fs.BuildPath(inputDir,"Ledger.tsv")) Then
 WScript.Echo "incomplete_finance_snapshot":WScript.Quit 5
End If
On Error Resume Next
Set app=CreateObject("Access.Application")
If Err.Number<>0 Then WScript.Echo "access_not_installed":WScript.Quit 6
Err.Clear
app.NewCurrentDatabase outputFile
If Err.Number<>0 Then WScript.Echo "access_create_failed: " & Err.Description:app.Quit:WScript.Quit 7
On Error GoTo 0
Set db=app.CurrentDb
Function U(value)
 Dim i,result:result=""
 For i=1 To Len(value) Step 4
  result=result & ChrW(CLng("&H" & Mid(value,i,4)))
 Next
 U=result
End Function
Function Q(value)
 Q="'" & Replace(CStr(value),"'","''") & "'"
End Function
Function N(value)
 Dim re: Set re=CreateObject("VBScript.RegExp")
 re.Pattern="^-?[0-9]{1,14}$":re.Global=False
 If Not re.Test(CStr(value)) Then Err.Raise vbObjectError+200,"PhotoBridge","Invalid money value"
 N=CStr(value)
End Function
Function Tsv(path)
 Dim stream,text
 Set stream=CreateObject("ADODB.Stream")
 stream.Type=2:stream.Charset="utf-8":stream.Open:stream.LoadFromFile path
 text=stream.ReadText(-1):stream.Close
 If Len(text)>0 Then If Left(text,1)=ChrW(&HFEFF) Then text=Mid(text,2)
 Tsv=Replace(text,vbCr,"")
End Function
Sub LoadRows(tableName, isLedger)
 Dim records,record,parts,sql,fields,count,i
 records=Split(Tsv(fs.BuildPath(inputDir,tableName & ".tsv")),vbLf)
 For Each record In records
  If Len(record)>0 Then
   parts=Split(record,vbTab)
   If UBound(parts)<>7 Then Err.Raise vbObjectError+201,"PhotoBridge","Unexpected column count in " & tableName
   If isLedger Then
    fields="[RowNo],[Ref],[DateJ],[Studio],[Details],[Debit],[Credit],[Balance]"
    sql="INSERT INTO [" & tableName & "](" & fields & ") VALUES (" & N(parts(0)) & "," & Q(parts(1)) & "," & Q(parts(2)) & "," & Q(parts(3)) & "," & Q(parts(4)) & "," & N(parts(5)) & "," & N(parts(6)) & "," & N(parts(7)) & ")"
   Else
    fields="[RowNo],[Ref],[DateJ],[Studio],[Details],[Kind],[Amount],[AccountingMark]"
    sql="INSERT INTO [" & tableName & "](" & fields & ") VALUES (" & N(parts(0)) & "," & Q(parts(1)) & "," & Q(parts(2)) & "," & Q(parts(3)) & "," & Q(parts(4)) & "," & Q(parts(5)) & "," & N(parts(6)) & "," & Q(parts(7)) & ")"
   End If
   db.Execute sql,128
  End If
 Next
End Sub
Sub View(viewName,caption,tableName,isLedger)
 Dim frm,temp,keys,headers,i,control,head,left,width
 Set frm=app.CreateForm
 temp=frm.Name:frm.Caption=caption
 frm.RecordSource="SELECT * FROM [" & tableName & "] ORDER BY [RowNo] DESC"
 frm.DefaultView=2:frm.AllowEdits=False:frm.AllowAdditions=False:frm.AllowDeletions=False
 frm.RecordSelectors=True:frm.NavigationButtons=True:frm.DividingLines=True
 If isLedger Then
  keys=Array("RowNo","Ref","DateJ","Studio","Details","Debit","Credit","Balance")
  headers=Array(U("0631062F06CC0641"),U("06340645062706310647002006330646062F"),U("062A0627063106CC062E"),U("062D063306270628"),U("06340631062D"),U("0628062F064706A906270631"),U("06280633062A0627064606A906270631"),U("064506270646062F0647"))
 Else
  keys=Array("RowNo","Ref","DateJ","Studio","Details","Kind","Amount","AccountingMark")
  headers=Array(U("0631062F06CC0641"),U("06340645062706310647002006330646062F"),U("062A0627063106CC062E"),U("063906A90627063306CC"),U("06340631062D"),U("064606480639"),U("064506280644063A"),U("062B0628062A0020062F06310020062D063306270628062F0627063106CC"))
 End If
 left=0
 For i=0 To UBound(keys)
  width=1500:If i=4 Then width=3100
  Set control=app.CreateControl(temp,acTextBox,0,,keys(i),left,0,width,300)
  control.Name="t"&keys(i):control.Locked=True:control.TabStop=False
  control.FontName="Vazirmatn":control.FontSize=10:control.ColumnWidth=width
  If (isLedger And i>=5) Or (Not isLedger And i=6) Then control.Format="#,##0"
  Set head=app.CreateControl(temp,acLabel,0,control.Name,,left,0,width,290)
  head.Caption=headers(i):head.FontName="Vazirmatn":head.FontSize=10
  left=left+width
 Next
 frm.Width=left+600
 app.DoCmd.Close acForm,temp,acSaveYes
 app.DoCmd.Rename viewName,acForm,temp
End Sub
db.Execute "CREATE TABLE [Invoices] ([RowNo] LONG PRIMARY KEY,[Ref] TEXT(100),[DateJ] TEXT(25),[Studio] TEXT(255),[Details] TEXT(255),[Kind] TEXT(60),[Amount] CURRENCY,[AccountingMark] TEXT(60))",128
db.Execute "CREATE TABLE [Receipts] ([RowNo] LONG PRIMARY KEY,[Ref] TEXT(100),[DateJ] TEXT(25),[Studio] TEXT(255),[Details] TEXT(255),[Kind] TEXT(60),[Amount] CURRENCY,[AccountingMark] TEXT(60))",128
db.Execute "CREATE TABLE [Ledger] ([RowNo] LONG PRIMARY KEY,[Ref] TEXT(100),[DateJ] TEXT(25),[Studio] TEXT(255),[Details] TEXT(255),[Debit] CURRENCY,[Credit] CURRENCY,[Balance] CURRENCY)",128
LoadRows "Invoices",False:LoadRows "Receipts",False:LoadRows "Ledger",True
View "frmPBInvoices",U("0641062706A9062A0648063106470627"),"Invoices",False
View "frmPBReceipts",U("062F063106CC06270641062A06CC200C06470627"),"Receipts",False
View "frmPBLedger",U("062D06330627062800200645063906CC0646"),"Ledger",True
app.CloseCurrentDatabase
app.Quit
WScript.Echo "PhotoBridge Access finance forms created"
