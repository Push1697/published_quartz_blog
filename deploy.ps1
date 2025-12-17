# Deploy Script for Quartz Blog
param (
    [string]$CommitMessage = "Content update"
)

$quartzDir = "C:\Users\Pushpendra\Documents\obsidian\quartz_blog"
Set-Location $quartzDir

Write-Host "Syncing with Quartz..." -ForegroundColor Cyan
npx quartz sync --no-pull --commit --push --message "$CommitMessage"

Write-Host "DEPLOYMENT TRIGGERED: GitHub Actions will build and publish your site." -ForegroundColor Green
Write-Host "Ensure you have set up your GitHub repository secrets and Pages settings." -ForegroundColor Yellow
