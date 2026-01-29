param([string]$Root="src")

$ErrorActionPreference = "Stop"
if (-not (Test-Path $Root)) { throw "No existe '$Root' en este directorio." }

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function LooksMojibake([string]$s) {
  return ($s -match "Ã|Â|â|ðŸ|ï¿½|`uFFFD")
}

function FixMojibake([string]$s) {
  $latin1 = [System.Text.Encoding]::GetEncoding("ISO-8859-1")
  $b = $latin1.GetBytes($s)
  $fixed = [System.Text.Encoding]::UTF8.GetString($b)
  $fixed = $fixed -replace [char]0xFFFD, ""
  return $fixed
}

$files = Get-ChildItem -Path $Root -Recurse -File -Include *.ts,*.tsx,*.js,*.jsx

$changed = 0
$stillBad = 0
$report = "ENCODING_FIX_REPORT.txt"
if (Test-Path $report) { Remove-Item $report -Force }

foreach ($f in $files) {
  $bytes = [System.IO.File]::ReadAllBytes($f.FullName)
  $txt = [System.Text.Encoding]::UTF8.GetString($bytes)
  $orig = $txt

  if (LooksMojibake $txt) {
    $txt = FixMojibake $txt
    if (LooksMojibake $txt) { $txt = FixMojibake $txt }
  }

  [System.IO.File]::WriteAllText($f.FullName, $txt, $utf8NoBom)

  if ($txt -ne $orig) { $changed++ }
  if (LooksMojibake $txt) {
    $stillBad++
    Add-Content -Path $report -Encoding UTF8 -Value ("STILL_BAD: " + $f.FullName)
  }
}

Add-Content -Path $report -Encoding UTF8 -Value ""
Add-Content -Path $report -Encoding UTF8 -Value ("Files: " + $files.Count)
Add-Content -Path $report -Encoding UTF8 -Value ("Changed content: " + $changed)
Add-Content -Path $report -Encoding UTF8 -Value ("Still suspicious: " + $stillBad)

Write-Host "✅ Encoding normalizado. Cambios en: $changed archivos."
Write-Host "📄 Reporte: $report"
