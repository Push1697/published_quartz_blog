function qn {
    param(
        [Parameter(Mandatory = $true, Position = 0)]
        [string]$NoteContent
    )
    $inboxPath = "c:\Users\Pushpendra\Documents\obsidian\zettelkasten\0-inbox\QuickCapture.md"
    
    # Ensure directory exists
    $parentDir = Split-Path $inboxPath -Parent
    if (-not (Test-Path $parentDir)) {
        New-Item -Path $parentDir -ItemType Directory -Force | Out-Null
    }

    if (-not (Test-Path $inboxPath)) {
        New-Item -Path $inboxPath -ItemType File -Force | Out-Null
    }
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $entry = "- [$timestamp] $NoteContent"
    Add-Content -Path $inboxPath -Value $entry
    Write-Host "Note saved to $inboxPath" -ForegroundColor Green
}
