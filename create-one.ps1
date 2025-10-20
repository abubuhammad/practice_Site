param(
  [string]$ApiBase = 'http://localhost:5000/api',
  [string]$Email = 'admin@example.com',
  [string]$Password = 'Admin123!',
  [int]$ExamId = 3
)
$loginBody = @{ email = $Email; password = $Password } | ConvertTo-Json
$loginResp = Invoke-RestMethod -Method Post -Uri "$ApiBase/auth/login" -ContentType 'application/json' -Body $loginBody
$headers = @{ Authorization = "Bearer $($loginResp.token)" }
$bodyObj = @{ exam_id = $ExamId; text = 'Test placeholder question'; question_type = 'single_choice'; explanation = '' ; order_index = 999 }
$body = $bodyObj | ConvertTo-Json -Depth 5
try {
  $res = Invoke-RestMethod -Method Post -Uri "$ApiBase/admin/questions" -Headers $headers -ContentType 'application/json' -Body $body
  $res | ConvertTo-Json -Depth 6
} catch {
  if ($_.Exception.Response -and $_.Exception.Response.GetResponseStream()) {
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $errTxt = $reader.ReadToEnd()
    Write-Host $errTxt
  } else {
    Write-Error $_
  }
  exit 1
}
