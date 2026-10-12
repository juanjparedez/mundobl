# Manual local-only validation server. Does not build, migrate, deploy or send mail.
param([switch]$Development)
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
$env:DATABASE_URL = 'postgresql://mundobl@127.0.0.1:55433/mundobl_replay'
$env:DIRECT_URL = $env:DATABASE_URL
$env:AUTH_SECRET = 'editorial-local-validation-only'
$env:NEXTAUTH_URL = 'http://localhost:3018'
$env:RESEND_API_KEY = ''
$env:GOOGLE_CLIENT_ID = ''
$env:GOOGLE_CLIENT_SECRET = ''
if ($Development) {
  npm run dev -- --hostname 127.0.0.1 --port 3018
} else {
  npm run start -- --hostname 127.0.0.1 --port 3018
}
