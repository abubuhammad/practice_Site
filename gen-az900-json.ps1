param(
  [string]$OutPath = 'C:\\Users\\Arome\\Documents\\APPS\\practice-site\\az-900-questions.json',
  [int]$Count = 160,
  [int]$StartIndex = 1
)
$questions = @()
for ($i=0; $i -lt $Count; $i++) {
  $n = $StartIndex + $i
  $questions += @{ text = "AZ-900 Placeholder Question $n"; question_type = 'single_choice'; explanation = '' }
}
$obj = @{ exam_code = 'AZ-900'; questions = $questions }
$obj | ConvertTo-Json -Depth 5 | Set-Content -Path $OutPath -Encoding UTF8
Write-Host "Wrote: $OutPath with $Count questions starting at $StartIndex"
