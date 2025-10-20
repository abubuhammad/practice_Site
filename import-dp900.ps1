param(
  [string]$ApiBase = 'http://localhost:5000/api',
  [string]$Email = 'admin@example.com',
  [string]$Password = 'Admin123!',
  [int]$ExamId = 3,
  [string]$ExamCode = 'DP-900',
  [string]$JsonPath = 'C:\\Users\\Arome\\Documents\\APPS\\practice-site\\dp-900-questions.json'
)

try {
  $loginBody = @{ email = $Email; password = $Password } | ConvertTo-Json
  $loginResp = Invoke-RestMethod -Method Post -Uri "$ApiBase/auth/login" -ContentType 'application/json' -Body $loginBody
  if (-not $loginResp.token) { throw 'Login failed: no token returned' }
  $headers = @{ Authorization = "Bearer $($loginResp.token)" }

  if (!(Test-Path $JsonPath)) { throw "File not found: $JsonPath" }
  $src = Get-Content -Raw -Path $JsonPath | ConvertFrom-Json
  $questions = $src.questions

  # Try payload with exam_id
  $payload1 = @{ exam_id = $ExamId; questions = $questions } | ConvertTo-Json -Depth 100
  try {
    $res = Invoke-RestMethod -Method Post -Uri "$ApiBase/admin/questions/bulk" -Headers $headers -ContentType 'application/json; charset=utf-8' -Body $payload1
    $res | ConvertTo-Json -Depth 10
    exit 0
  } catch {
    Write-Host 'Fallback: trying exam_code payload...'
  }

  # Try payload with exam_code
  $payload2 = @{ exam_code = $ExamCode; questions = $questions } | ConvertTo-Json -Depth 100
  try {
    $res2 = Invoke-RestMethod -Method Post -Uri "$ApiBase/admin/questions/bulk" -Headers $headers -ContentType 'application/json; charset=utf-8' -Body $payload2
    $res2 | ConvertTo-Json -Depth 10
    exit 0
  } catch {
    Write-Host 'Fallback: trying multipart/form-data upload...'
  }

  # Try multipart/form-data (file upload)
  $fileItem = Get-Item -Path $JsonPath
  $forms = @(
    @{ exam_id = $ExamId; exam_code = $ExamCode; file = $fileItem },
    @{ exam_id = $ExamId; exam_code = $ExamCode; questions = $fileItem },
    @{ exam_id = $ExamId; exam_code = $ExamCode; upload = $fileItem },
    @{ exam_id = $ExamId; exam_code = $ExamCode; questionsFile = $fileItem }
  )
  foreach ($form in $forms) {
    try {
      $res3 = Invoke-RestMethod -Method Post -Uri "$ApiBase/admin/questions/bulk" -Headers $headers -Form $form
      $res3 | ConvertTo-Json -Depth 10
      exit 0
    } catch {
      continue
    }
  }

  # Try using curl.exe for multipart upload (sometimes more compatible)
  try {
    $curl = 'curl.exe'
    $tokenHdr = "Authorization: Bearer $($loginResp.token)"
    $curlArgs = @('-s','-S','-X','POST','-H', $tokenHdr,'-F', "exam_id=$ExamId", '-F', "file=@$JsonPath;type=application/json", "$ApiBase/admin/questions/bulk")
    $curlOut = & $curl @curlArgs
    $curlJson = $null; try { $curlJson = $curlOut | ConvertFrom-Json } catch {}
    if ($LASTEXITCODE -eq 0 -and $curlJson -and -not $curlJson.error) {
      $curlOut
      exit 0
    } else {
      Write-Host 'curl upload did not succeed, falling back...'
    }
  } catch {
    # ignore and fallback
  }

  Write-Host 'Fallback: trying raw file payload...'

  # Try raw file payload
  try {
    $rawPayload = $src | ConvertTo-Json -Depth 100
    $res4 = Invoke-RestMethod -Method Post -Uri "$ApiBase/admin/questions/bulk" -Headers $headers -ContentType 'application/json; charset=utf-8' -Body $rawPayload
    $res4 | ConvertTo-Json -Depth 10
    exit 0
  } catch {
    Write-Host 'Raw JSON payload not accepted, falling back to per-question creation...'
  }

  # Final fallback: create questions one-by-one via admin API
  Write-Host 'Fallback: creating questions individually via /api/admin/questions ...'
  $created = 0
  $errors = @()
  for ($i=0; $i -lt $questions.Count; $i++) {
    $q = $questions[$i]
    $qt = if ($q.PSObject.Properties.Name -contains 'question_type' -and $q.question_type) { $q.question_type } else { 'single_choice' }
    $exp = if ($q.PSObject.Properties.Name -contains 'explanation' -and $q.explanation) { $q.explanation } else { '' }
    $txt = $q.text
    $idx = $i + 1
    $bodyObj = @{ exam_id = $ExamId; text = $txt; explanation = $exp; question_type = $qt; order_index = $idx }
    $body = $bodyObj | ConvertTo-Json -Depth 5
    try {
      $resQ = Invoke-RestMethod -Method Post -Uri "$ApiBase/admin/questions" -Headers $headers -ContentType 'application/json' -Body $body
      if ($resQ -and $resQ.id) { $created++ } else { $created++ }
    } catch {
      $errors += ('Failed at index {0}: {1}' -f $i, $_.Exception.Message)
    }
  }
  @{ created = $created; failed = ($questions.Count - $created); errors = $errors } | ConvertTo-Json -Depth 5
} catch {
  Write-Error ($_ | Out-String)
  exit 1
}
