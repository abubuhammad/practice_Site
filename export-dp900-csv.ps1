param(
  [string]$JsonPath = 'C:\Users\Arome\Documents\APPS\practice-site\dp-900-questions.json',
  [string]$CsvPath = 'C:\Users\Arome\Documents\APPS\practice-site\dp-900-questions.csv'
)
if (!(Test-Path $JsonPath)) { throw "File not found: $JsonPath" }
$obj = Get-Content -Raw -Path $JsonPath | ConvertFrom-Json
$rows = foreach ($q in $obj.questions) {
  [pscustomobject]@{
    question_text = $q.text
    question_type = $q.question_type
    explanation   = ($q.explanation | ForEach-Object { $_ })
    case_study_title = $q.case_study_title
  }
}
$rows | Export-Csv -Path $CsvPath -NoTypeInformation -Encoding UTF8
Write-Host "Wrote: $CsvPath"