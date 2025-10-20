param(
  [string]$ApiBase = 'http://localhost:5000/api',
  [string]$Email = 'admin@example.com',
  [string]$Password = 'Admin123!',
  [int]$ExamId = 3
)
$loginBody = @{ email = $Email; password = $Password } | ConvertTo-Json
$loginResp = Invoke-RestMethod -Method Post -Uri "$ApiBase/auth/login" -ContentType 'application/json' -Body $loginBody
$headers = @{ Authorization = "Bearer $($loginResp.token)" }
$res = Invoke-RestMethod -Method Get -Uri "$ApiBase/admin/questions?exam_id=$ExamId" -Headers $headers
$res | ConvertTo-Json -Depth 6
