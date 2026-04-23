$projectPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$driveLetter = 'V:'

try {
  subst $driveLetter $projectPath | Out-Null
} catch {
}

Set-Location "$driveLetter\"
node .\node_modules\vite\bin\vite.js --host 127.0.0.1 --port 5173
