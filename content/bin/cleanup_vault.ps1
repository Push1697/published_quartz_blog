param(
    [string]$VaultPath = "c:\Users\Pushpendra\Documents\obsidian\zettelkasten",
    [switch]$Delete = $false
)

$files = Get-ChildItem -Path $VaultPath -Recurse -Include *.md, *.txt

$candidates = @()

foreach ($file in $files) {
    # Skip templates and bin
    if ($file.FullName -match "Templates" -or $file.FullName -match "\\bin\\" -or $file.FullName -match "\\.obsidian\\") { continue }

    $content = Get-Content $file.FullName -Raw
    $length = 0
    if ($content) { $length = $content.Trim().Length }

    # Criteria for "Unusable"
    $reason = ""
    
    if ($file.Length -eq 0) {
        $reason = "Empty File (0 bytes)"
    }
    elseif ($length -eq 0) {
        $reason = "Empty Content (Whitespace only)"
    }
    elseif ($length -lt 20 -and $file.Name -match "Untitled") {
        $reason = "Small Untitled Note"
    }

    if ($reason) {
        $candidates += [PSCustomObject]@{
            Name   = $file.Name
            Path   = $file.FullName
            Reason = $reason
            Size   = $file.Length
        }
    }
}

$candidates | Format-Table Name, Reason, Size -AutoSize

if ($Delete -and $candidates.Count -gt 0) {
    Write-Host "Moving $($candidates.Count) files to .trash..." -ForegroundColor Yellow
    $trashPath = Join-Path $VaultPath ".trash"
    if (-not (Test-Path $trashPath)) { New-Item -ItemType Directory -Path $trashPath | Out-Null }
    
    foreach ($c in $candidates) {
        Move-Item -Path $c.Path -Destination $trashPath -Force
        Write-Host "Moved: $($c.Name)"
    }
}
