$word = New-Object -ComObject Word.Application
$word.Visible = $false
$docPath = "C:\Users\Abinson Babu\Desktop\ieee-sb-portal\docs\PROJECT_REPORT.docx"
$pdfPath = "C:\Users\Abinson Babu\Desktop\ieee-sb-portal\docs\PROJECT_REPORT.pdf"

$doc = $word.Documents.Open($docPath)
$doc.SaveAs([ref]$pdfPath, [ref]17)
$doc.Close()
$word.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
Write-Output "Word COM PDF conversion SUCCESS!"
