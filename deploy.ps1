# Deploy Script for Quartz Blog
param (
    [string]$CommitMessage = "Content update",
    [string]$VaultPath = "$env:USERPROFILE\Dropbox\Obsidian\zettelkasten"
)

$quartzDir = "C:\Users\Pushpendra\Documents\obsidian\quartz_blog"
$contentDir = "$quartzDir\content"

# Step 1: Sync published content from Obsidian vault
Write-Host "Step 1: Syncing published notes from vault..." -ForegroundColor Cyan

# Clear content directory (except .git if exists)
Get-ChildItem -Path $contentDir -Exclude ".git*" | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

# Copy only files with BOTH publish: true (public-safe, per the checklist)
# AND garden: true (explicitly opted into the digital garden, separate from
# the Hashnode blog which is published manually per-post instead)
$publishedCount = 0
Get-ChildItem -Path $VaultPath -Recurse -Filter "*.md" | ForEach-Object {
    try {
        $content = Get-Content $_.FullName -Raw -ErrorAction Stop
        if ($content -match "publish:\s*true" -and $content -match "garden:\s*true") {
            $relativePath = $_.FullName.Replace($VaultPath, "").TrimStart("\")
            $destination = Join-Path $contentDir $relativePath
            
            # Create directory if needed
            $destDir = Split-Path $destination -Parent
            if (!(Test-Path $destDir)) {
                New-Item -ItemType Directory -Path $destDir -Force | Out-Null
            }
            
            Copy-Item $_.FullName -Destination $destination -Force
            $publishedCount++
            Write-Host "  Published: $relativePath" -ForegroundColor Green
        }
    } catch {
        # Skip files that can't be read
    }
}

# Copy images and attachments
if (Test-Path "$VaultPath\3-Resources\System\Attachments") {
    Write-Host "Copying attachments..." -ForegroundColor Cyan
    Copy-Item "$VaultPath\3-Resources\System\Attachments" -Destination "$contentDir\3-Resources\System\" -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "Published $publishedCount file(s)" -ForegroundColor Yellow

# Step 2: Commit and push to Quartz repo
Write-Host ""
Write-Host "Step 2: Committing to Quartz repository..." -ForegroundColor Cyan
Set-Location $quartzDir

git add .
$hasChanges = git status --porcelain
if ($hasChanges) {
    git commit -m "$CommitMessage"
    git push origin v4
    
    Write-Host ""
    Write-Host "DEPLOYMENT TRIGGERED!" -ForegroundColor Green
    Write-Host "GitHub Actions will build and publish your site." -ForegroundColor Green
    Write-Host "Check: https://github.com/Push1697/published_quartz_blog/actions" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Your site will be live at: https://push1697.github.io/published_quartz_blog" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "No changes to deploy" -ForegroundColor Yellow
}
