param(
  [string]$ApiBase = 'http://localhost:5000/api',
  [string]$Email = 'admin@example.com',
  [string]$Password = 'Admin123!',
  [string]$JsonPath = 'C:\\Users\\Arome\\Documents\\APPS\\practice-site\\dp-900-questions.json',
  [int]$BatchSize = 40,
  [string]$ExamCode = 'DP-900'
)

function Sanitize-Text([string]$s) {
  if (-not $s) { return '' }
  # replace non-ASCII with simple dash/space
  $t = ($s -replace "[^\x20-\x7E]", '-')
  # collapse multiple spaces/dashes
  $t = ($t -replace "[-]{2,}", '-')
  return $t
}

# Login
$loginBody = @{ email = $Email; password = $Password } | ConvertTo-Json
$loginResp = Invoke-RestMethod -Method Post -Uri "$ApiBase/auth/login" -ContentType 'application/json' -Body $loginBody
if (-not $loginResp.token) { throw 'Login failed: no token' }
$headers = @{ Authorization = "Bearer $($loginResp.token)" }

# Load and transform
$obj = Get-Content -Raw -Path $JsonPath | ConvertFrom-Json
$all = @()
foreach ($q in $obj.questions) {
  $qt = if ($q.PSObject.Properties.Name -contains 'question_type' -and $q.question_type) { $q.question_type } else { 'single_choice' }
  $all += @{ text = (Sanitize-Text ($q.text)); question_type = $qt; explanation = '' }
}

# Send in batches
for ($i=0; $i -lt $all.Count; $i += $BatchSize) {
  $chunk = $all[$i..([math]::Min($i+$BatchSize-1, $all.Count-1))]
  $bodyObj = @{ exam_code = $ExamCode; questions = $chunk }
  $json = $bodyObj | ConvertTo-Json -Depth 10
  $resp = Invoke-RestMethod -Method Post -Uri "$ApiBase/admin/questions/bulk-json" -Headers $headers -ContentType 'application/json' -Body $json
  Write-Host ("Batch {0}-{1}: imported={2} skipped={3}" -f $i, ($i + $chunk.Count - 1), $resp.imported_rows, $resp.skipped_rows)
}
