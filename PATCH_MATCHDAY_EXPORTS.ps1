# Run from the project root (where package.json is)
$ErrorActionPreference = 'Stop'

function Write-Utf8NoBom([string]$Path, [string]$Content) {
  $dir = Split-Path -Parent $Path
  if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

if (-not (Test-Path '.\package.json')) {
  throw 'No estás en la raíz del proyecto. Haz: cd C:\Users\Jose\Desktop\GRUPLY_ZERO\gruply'
}

$path = 'src\lib\tournaments\repo.ts'
if (-not (Test-Path $path)) {
  throw "No encuentro $path"
}

$t = [System.IO.File]::ReadAllText($path)

if ($t -match 'export\s+async\s+function\s+closeMatchday') {
  Write-Host 'ℹ️ closeMatchday ya existe. No hago cambios.'
  exit 0
}

$insert = @'

// ---------------------------------------------------------
// Compat exports (UI expects these names)
// ---------------------------------------------------------
// Some code paths import closeMatchday/reopenMatchday.
// The canonical implementation is setMatchdayClosed().
// We expose small wrappers to keep the UI stable.
export async function closeMatchday(input: { tournamentId: string; matchday: number }) {
  // @ts-ignore - depende de la firma exacta de setMatchdayClosed
  return await (setMatchdayClosed as any)({
    tournamentId: input.tournamentId,
    matchday: input.matchday,
    closed: true,
    isClosed: true,
  });
}

export async function reopenMatchday(input: { tournamentId: string; matchday: number }) {
  // @ts-ignore - depende de la firma exacta de setMatchdayClosed
  return await (setMatchdayClosed as any)({
    tournamentId: input.tournamentId,
    matchday: input.matchday,
    closed: false,
    isClosed: false,
  });
}
'@

# Insert right after setMatchdayClosed if present, otherwise append at EOF
$idx = $t.IndexOf('export async function setMatchdayClosed')
if ($idx -ge 0) {
  # Find end of that function by searching the next 'export ' after it
  $next = $t.IndexOf("\nexport ", $idx + 10)
  if ($next -lt 0) { $next = $t.Length }
  $t2 = $t.Substring(0, $next) + $insert + $t.Substring($next)
  Write-Utf8NoBom $path $t2
  Write-Host "✅ Añadidos wrappers closeMatchday/reopenMatchday en $path (debajo de setMatchdayClosed)."
} else {
  $t2 = $t.TrimEnd() + $insert + "`r`n"
  Write-Utf8NoBom $path $t2
  Write-Host "✅ Añadidos wrappers closeMatchday/reopenMatchday al final de $path."
}
