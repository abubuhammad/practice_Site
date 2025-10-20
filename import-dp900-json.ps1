param(
  [string]$ApiBase = 'http://localhost:5000/api',
  [string]$Email = 'admin@example.com',
  [string]$Password = 'Admin123!',
  [string]$JsonPath = 'C:\\Users\\Arome\\Documents\\APPS\\practice-site\\dp-900-questions.json'
)

# Login to get admin JWT
$loginBody = @{ email = $Email; password = $Password } | ConvertTo-Json
$loginResp = Invoke-RestMethod -Method Post -Uri "$ApiBase/auth/login" -ContentType 'application/json' -Body $loginBody
if (-not $loginResp.token) { throw 'Login failed: no token' }
$headers = @{ Authorization = "Bearer $($loginResp.token)" }

# Load JSON body and ensure shape { exam_code|exam_id, questions: [...] }
if (!(Test-Path $JsonPath)) { throw "File not found: $JsonPath" }
$raw = Get-Content -Raw -Path $JsonPath
# Trust file schema (already contains exam_code). If you want to force exam_code, uncomment below and adjust.
# $jsonObj = $raw | ConvertFrom-Json; if (-not $jsonObj.exam_code -and -not $jsonObj.exam_id) { $jsonObj | Add-Member -NotePropertyName exam_code -NotePropertyValue 'DP-900' }; $raw = $jsonObj | ConvertTo-Json -Depth 100
$body = $raw

# Post to JSON bulk endpoint
$resp = Invoke-RestMethod -Method Post -Uri "$ApiBase/admin/questions/bulk-json" -Headers $headers -ContentType 'application/json' -Body $body
$resp | ConvertTo-Json -Depth 10
