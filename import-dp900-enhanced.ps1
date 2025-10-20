param(
  [string]$ApiBase = 'http://localhost:5000/api',
  [string]$Email = 'admin@example.com',
  [string]$Password = 'Admin123!',
  [string]$CsvPath = "C:\\Users\\Arome\\Documents\\APPS\\practice-site\\backend\\uploads\\dp900-enhanced-template.csv",
  [string]$ColumnMapPath = "C:\\Users\\Arome\\Documents\\APPS\\practice-site\\backend\\uploads\\dp900-column-map.json"
)

# 1) Login to get admin JWT
$loginBody = @{ email = $Email; password = $Password } | ConvertTo-Json
$loginResp = Invoke-RestMethod -Method Post -Uri "$ApiBase/auth/login" -ContentType 'application/json' -Body $loginBody
if (-not $loginResp.token) { throw 'Login failed: no token' }
$headers = @{ Authorization = "Bearer $($loginResp.token)" }

# 2) Resolve exam_id for DP-900
$exams = Invoke-RestMethod -Method Get -Uri "$ApiBase/admin/exams" -Headers $headers
$dp900 = $exams.exams | Where-Object { $_.code -eq 'DP-900' }
if (-not $dp900) { throw 'DP-900 exam not found. Seed the DB or create the exam first.' }
$examId = $dp900.id

# 3) Validate files
if (!(Test-Path $CsvPath)) { throw "CSV not found: $CsvPath" }
if (!(Test-Path $ColumnMapPath)) { throw "Column map not found: $ColumnMapPath" }
$columnMapJson = Get-Content -Raw -Path $ColumnMapPath

# 4) Upload via enhanced bulk endpoint
$form = @{
  file = Get-Item -Path $CsvPath
  exam_id = $examId
  column_map = $columnMapJson
  case_study_mode = 'link'
  create_missing_case_studies = 'false'
}

$resp = Invoke-RestMethod -Method Post -Uri "$ApiBase/admin/questions/bulk-enhanced" -Headers $headers -Form $form
$resp | ConvertTo-Json -Depth 10
