param(
  [string]$ApiBase = 'http://localhost:5000/api',
  [int]$ExamId = 3,
  [string]$Email = 'admin@example.com',
  [string]$Password = 'Admin123!',
  [string]$CsvPath = 'C:\\Users\\Arome\\Documents\\APPS\\practice-site\\dp-900-questions.csv'
)
$mappingPath = 'C:\\Users\\Arome\\Documents\\APPS\\practice-site\\mapping.json'
$mapping = @{ question_text='question_text'; question_type='question_type'; explanation='explanation'; case_study_title='case_study_title' } | ConvertTo-Json -Compress
Set-Content -Path $mappingPath -Value $mapping -Encoding UTF8
$token = (Invoke-RestMethod -Method Post -Uri "$ApiBase/auth/login" -ContentType 'application/json' -Body (@{ email=$Email; password=$Password } | ConvertTo-Json)).token
$hdr = "Authorization: Bearer $token"
& curl.exe -s -S -X POST -H $hdr -F "exam_id=$ExamId" -F "mapping=@$mappingPath;type=application/json" -F "file=@$CsvPath;type=text/csv" "$ApiBase/admin/questions/bulk"
