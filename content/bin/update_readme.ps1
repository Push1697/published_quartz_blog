param(
    [string]$VaultPath = "c:\Users\Pushpendra\Documents\obsidian\zettelkasten"
)

$ReadmePath = Join-Path $VaultPath "Readme.md"

# 1. Gather Stats
$allFiles = Get-ChildItem -Path $VaultPath -Recurse -Include *.md
$totalNotes = $allFiles.Count
$lastUpdate = Get-Date -Format "yyyy-MM-dd HH:mm"

# Count by Category
$inboxCount = (Get-ChildItem -Path "$VaultPath\0-inbox" -Recurse -Include *.md).Count
$projectCount = (Get-ChildItem -Path "$VaultPath\1-projects" -Recurse -Include *.md).Count
$areaCount = (Get-ChildItem -Path "$VaultPath\2-areas" -Recurse -Include *.md).Count
$resourceCount = (Get-ChildItem -Path "$VaultPath\3-resources" -Recurse -Include *.md).Count
$archiveCount = (Get-ChildItem -Path "$VaultPath\4-archives" -Recurse -Include *.md).Count

# Recent Changes (Top 5 modified in last 7 days)
$recentFiles = $allFiles | Where-Object { $_.LastWriteTime -gt (Get-Date).AddDays(-7) } | Sort-Object LastWriteTime -Descending | Select-Object -First 5

# 2. Build Markdown Content
$md = @"
# 🧠 My Digital Garden (Zettelkasten)

> *A note is your garden of your thoughts which you create over the time and drip every single drop of your information you have gathered.*

![Vault Status](https://img.shields.io/badge/Vault_Status-Active-success)
![Last Update](https://img.shields.io/badge/Last_Update-$($lastUpdate.Replace(' ','_'))-blue)
![Total Notes](https://img.shields.io/badge/Notes-$totalNotes-blueviolet)

## 📊 Knowledge Base Stats

| Section | Count | Description |
| :--- | :---: | :--- |
| **0-Inbox** | $inboxCount | Unprocessed thoughts |
| **1-Projects** | $projectCount | Active work in progress |
| **2-Areas** | $areaCount | Long-term responsibilities |
| **3-Resources** | $resourceCount | Reference materials |
| **4-Archives** | $archiveCount | Completed/Inactive items |

## 🕒 Recent Updates
Here is what I've been working on lately:

"@

foreach ($file in $recentFiles) {
    $relPath = $file.FullName.Substring($VaultPath.Length + 1).Replace('\', '/')
    $md += "- [$($file.BaseName)]($relPath) - *$($file.LastWriteTime.ToString('MMM dd'))*`n"
}

$md += @"

## 🗂️ Vault Structure
This vault follows the **PARA Method** + **Zettelkasten**:
- **Inbox**: Where everything starts.
- **Projects**: Time-bound goals.
- **Areas**: Ongoing standards to maintain.
- **Resources**: Topics of interest (The Zettelkasten Core).
- **Archives**: Cold storage.

---
*Generated automatically by `bin/update_readme.ps1`*
"@

# 3. Write to Readme.md (Force UTF-8 NO BOM)
$Utf8NoBom = New-Object System.Text.UTF8Encoding $False
[System.IO.File]::WriteAllText($ReadmePath, $md, $Utf8NoBom)
Write-Host "Readme.md updated successfully! (UTF-8 No BOM)" -ForegroundColor Green
