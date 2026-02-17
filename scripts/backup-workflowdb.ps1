$ErrorActionPreference = "Stop"

$repoRoot = "C:\Users\Admin\Desktop\WorkflowPlatform"
$backupDir = Join-Path $repoRoot "backups"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupFile = Join-Path $backupDir "workflowdb-$timestamp.sql"
$retentionDays = 14

if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
}

# Dump current DB from the running postgres container.
& docker exec workflow-postgres pg_dump -U workflow -d workflowdb --no-owner --no-privileges > $backupFile

if (-not (Test-Path $backupFile)) {
    throw "Backup file was not created: $backupFile"
}

# Keep only recent backups.
Get-ChildItem -Path $backupDir -Filter "workflowdb-*.sql" -File |
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$retentionDays) } |
    Remove-Item -Force

Write-Output "Backup complete: $backupFile"
