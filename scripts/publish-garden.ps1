<#
.SYNOPSIS
    Publish explicitly public Obsidian notes into the Quartz /blog URL space.

.DESCRIPTION
    Windows-native counterpart to scripts/publish-garden (bash). Both implement
    the same contract:

      * A note is published only when its YAML frontmatter contains BOTH
        `publish: true` AND `garden: true`. The double opt-in exists because the
        vault repository is private and the Quartz repository is public.
      * Every selected note is copied to content/blog/<slug>.md, so public URLs
        never reveal vault folders such as 0-inbox or 3-Resources.
      * A `section:` is injected for homepage/sidebar grouping. Source notes may
        override the inferred value with `section:` in their own frontmatter.
      * content/index.md is the curated homepage and is always preserved.
      * Content is mirrored, not merged: notes that lose their flags are removed
        from the published site.

    Roots default to this repository and a sibling `zettelkasten` vault, and can
    be overridden with the GARDEN_QUARTZ and GARDEN_VAULT environment variables.

.PARAMETER DryRun
    Show the generated public URLs without changing content.

.PARAMETER SyncOnly
    Sync content without running a Quartz build.

.PARAMETER Push
    Commit synced content and push branch v4, triggering the Pages deployment.

.PARAMETER Message
    Commit message used with -Push.

.EXAMPLE
    .\scripts\publish-garden.ps1 -DryRun

.EXAMPLE
    .\scripts\publish-garden.ps1 -SyncOnly -Push -Message "Publish MySQL guide"
#>
[CmdletBinding()]
param(
    [switch]$DryRun,
    [switch]$SyncOnly,
    [switch]$Push,
    [Alias('m')][string]$Message = 'Publish digital garden updates'
)

$ErrorActionPreference = 'Stop'

# --- Roots -------------------------------------------------------------------
$scriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$quartzRoot = $env:GARDEN_QUARTZ
if ([string]::IsNullOrWhiteSpace($quartzRoot)) { $quartzRoot = Split-Path -Parent $scriptDir }
$vaultRoot = $env:GARDEN_VAULT
if ([string]::IsNullOrWhiteSpace($vaultRoot)) { $vaultRoot = Join-Path (Split-Path -Parent $quartzRoot) 'zettelkasten' }

if (-not (Test-Path -LiteralPath $quartzRoot -PathType Container)) {
    throw "Quartz repository not found: $quartzRoot (set GARDEN_QUARTZ to override)"
}
$quartzRoot  = (Resolve-Path -LiteralPath $quartzRoot).Path
$contentRoot = Join-Path $quartzRoot 'content'
$homepage    = Join-Path $contentRoot 'index.md'

if (-not (Test-Path -LiteralPath $vaultRoot -PathType Container)) {
    throw "Vault not found: $vaultRoot (set GARDEN_VAULT to override)"
}
$vaultRoot = (Resolve-Path -LiteralPath $vaultRoot).Path
if (-not (Test-Path -LiteralPath (Join-Path $quartzRoot '.git'))) {
    throw "Not a git repository: $quartzRoot"
}
if (-not (Test-Path -LiteralPath $homepage -PathType Leaf)) {
    throw "Curated homepage missing: $homepage"
}

# --- Single-instance guard (the bash publisher uses flock) -------------------
$mutex = New-Object System.Threading.Mutex($false, 'Global\pushpendra-garden-publish')
if (-not $mutex.WaitOne(0)) { throw 'Another garden publish is already running' }

$utf8NoBom   = New-Object System.Text.UTF8Encoding($false)
$stagingRoot = Join-Path ([System.IO.Path]::GetTempPath()) ('pushpendra-garden-' + [System.Guid]::NewGuid().ToString('N').Substring(0, 8))

function Get-Frontmatter {
    # Returns the frontmatter lines, or $null when the file has no frontmatter block.
    param([string[]]$Lines)
    if ($null -eq $Lines -or $Lines.Count -eq 0) { return $null }
    $first = $Lines[0].TrimStart([char]0xFEFF).Trim()
    if ($first -ne '---') { return $null }
    $block = New-Object System.Collections.Generic.List[string]
    for ($i = 1; $i -lt $Lines.Count; $i++) {
        if ($Lines[$i].Trim() -eq '---') { return $block }
        $block.Add($Lines[$i])
    }
    # Unterminated frontmatter: treat as absent, matching the awk implementation.
    return $null
}

function Test-PublicNote {
    param($Frontmatter)
    if ($null -eq $Frontmatter) { return $false }
    $publish = $false
    $garden  = $false
    foreach ($line in $Frontmatter) {
        if ($line -match '^\s*publish:\s*true\s*$') { $publish = $true }
        if ($line -match '^\s*garden:\s*true\s*$')  { $garden  = $true }
    }
    return ($publish -and $garden)
}

function Get-FrontmatterSection {
    param($Frontmatter)
    foreach ($line in $Frontmatter) {
        if ($line -match '^\s*section:\s*(.*)$') { return $Matches[1].Trim().Trim('"') }
    }
    return ''
}

function Get-InferredSection {
    param([string]$RelativePath)
    $t = $RelativePath.ToLowerInvariant()
    if ($t -match 'runbook|start.*stop|maintenance')                                { return 'Runbooks' }
    if ($t -match 'fix|troubleshoot|error|issue|debug|failure')                      { return 'Troubleshooting' }
    if ($t -match 'cheat|log|reference')                                             { return 'Reference' }
    if ($t -match 'introduction|fundamental|course|college.*student|virtualization') { return 'Foundations' }
    return 'Guides'
}

function Get-Slug {
    param([string]$FileName)
    $slug = ($FileName -replace '\.md$', '').ToLowerInvariant()
    $slug = $slug -replace '[^a-z0-9]+', '-'
    $slug = $slug -replace '^-+', ''
    $slug = $slug -replace '-+$', ''
    if ([string]::IsNullOrWhiteSpace($slug)) { $slug = 'note' }
    return $slug
}

function Get-PathHash {
    param([string]$Text)
    $sha = [System.Security.Cryptography.SHA256]::Create()
    try {
        $bytes = $sha.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($Text))
        $hex = -join ($bytes | ForEach-Object { $_.ToString('x2') })
        return $hex.Substring(0, 8)
    } finally {
        $sha.Dispose()
    }
}

function Write-PublicCopy {
    # Copies the note, injecting `section:` as the first frontmatter key and
    # dropping any pre-existing section line. Always writes LF: .gitattributes
    # normalises this repo to eol=lf, so LF output keeps diffs clean whether the
    # publish ran from Windows or Linux.
    param([string[]]$Lines, [string]$Destination, [string]$Section)
    $out = New-Object System.Collections.Generic.List[string]
    $inFrontmatter = $false
    for ($i = 0; $i -lt $Lines.Count; $i++) {
        $line = $Lines[$i]
        if ($i -eq 0) {
            $out.Add('---')
            $out.Add("section: $Section")
            $inFrontmatter = $true
            continue
        }
        if ($inFrontmatter -and $line.Trim() -eq '---') {
            $out.Add($line)
            $inFrontmatter = $false
            continue
        }
        if ($inFrontmatter -and $line -match '^\s*section:\s*') { continue }
        $out.Add($line)
    }
    [System.IO.File]::WriteAllText($Destination, (($out -join "`n") + "`n"), $utf8NoBom)
}

try {
    New-Item -ItemType Directory -Path (Join-Path $stagingRoot 'blog') -Force | Out-Null

    # The curated homepage is preserved verbatim.
    Copy-Item -LiteralPath $homepage -Destination (Join-Path $stagingRoot 'index.md') -Force

    $excluded = @('.git', '.obsidian', '.trash')
    $notes = Get-ChildItem -LiteralPath $vaultRoot -Recurse -File -Filter '*.md' -Force |
        Where-Object {
            $rel  = $_.FullName.Substring($vaultRoot.Length).TrimStart('\', '/')
            $head = ($rel -split '[\\/]')[0]
            $excluded -notcontains $head
        }

    $seenSlugs = @{}
    $publishedCount = 0

    foreach ($note in ($notes | Sort-Object FullName)) {
        $lines = [System.IO.File]::ReadAllLines($note.FullName)
        $fm = Get-Frontmatter -Lines $lines
        if (-not (Test-PublicNote -Frontmatter $fm)) { continue }

        $relativePath = ($note.FullName.Substring($vaultRoot.Length).TrimStart('\', '/')) -replace '\\', '/'
        $slug = Get-Slug -FileName $note.Name
        if ($seenSlugs.ContainsKey($slug)) { $slug = $slug + '-' + (Get-PathHash $relativePath) }
        $seenSlugs[$slug] = $true

        $section = Get-FrontmatterSection -Frontmatter $fm
        if ([string]::IsNullOrWhiteSpace($section)) { $section = Get-InferredSection -RelativePath $relativePath }

        Write-PublicCopy -Lines $lines -Destination (Join-Path $stagingRoot "blog\$slug.md") -Section $section
        Write-Host ("  include  blog/{0}.md  <-  {1} [{2}]" -f $slug, $relativePath, $section) -ForegroundColor Green
        $publishedCount++
    }

    Write-Host ''
    Write-Host "Selected $publishedCount public note(s), plus the curated homepage." -ForegroundColor Yellow

    # --- Mirror staging -> content (equivalent to rsync --delete) -------------
    $staged = @{}
    Get-ChildItem -LiteralPath $stagingRoot -Recurse -File | ForEach-Object {
        $key = ($_.FullName.Substring($stagingRoot.Length).TrimStart('\', '/')) -replace '\\', '/'
        $staged[$key] = $_.FullName
    }

    $existing = @{}
    if (Test-Path -LiteralPath $contentRoot) {
        Get-ChildItem -LiteralPath $contentRoot -Recurse -File -Force | ForEach-Object {
            $key = ($_.FullName.Substring($contentRoot.Length).TrimStart('\', '/')) -replace '\\', '/'
            $existing[$key] = $_.FullName
        }
    } else {
        New-Item -ItemType Directory -Path $contentRoot -Force | Out-Null
    }

    $added = 0; $updated = 0; $deleted = 0

    foreach ($rel in $staged.Keys) {
        $src = $staged[$rel]
        $dst = Join-Path $contentRoot ($rel -replace '/', '\')
        if (-not $existing.ContainsKey($rel)) {
            Write-Host "  + add     content/$rel" -ForegroundColor Cyan
            $added++
        } else {
            $srcBytes = [System.IO.File]::ReadAllBytes($src)
            $dstBytes = [System.IO.File]::ReadAllBytes($dst)
            if (($srcBytes.Length -eq $dstBytes.Length) -and (($srcBytes -join ',') -eq ($dstBytes -join ','))) { continue }
            Write-Host "  ~ update  content/$rel" -ForegroundColor Cyan
            $updated++
        }
        if (-not $DryRun) {
            $dstDir = Split-Path -Parent $dst
            if (-not (Test-Path -LiteralPath $dstDir)) { New-Item -ItemType Directory -Path $dstDir -Force | Out-Null }
            Copy-Item -LiteralPath $src -Destination $dst -Force
        }
    }

    foreach ($rel in $existing.Keys) {
        if ($staged.ContainsKey($rel)) { continue }
        Write-Host "  - delete  content/$rel" -ForegroundColor DarkYellow
        $deleted++
        if (-not $DryRun) { Remove-Item -LiteralPath $existing[$rel] -Force }
    }

    Write-Host ''
    Write-Host "Content mirror: $added added, $updated updated, $deleted removed." -ForegroundColor Yellow

    if ($DryRun) {
        Write-Host 'Dry run complete; no files were changed.' -ForegroundColor Yellow
        return
    }

    if (-not $SyncOnly) {
        if (-not (Test-Path -LiteralPath (Join-Path $quartzRoot 'node_modules') -PathType Container)) {
            throw ("Dependencies are not installed, so Quartz cannot build locally.`n" +
                   "Run 'npm ci' in $quartzRoot once, or re-run this script with -SyncOnly " +
                   "to publish without a local build (GitHub Actions builds the site anyway).")
        }
        Write-Host ''
        Write-Host 'Building Quartz...' -ForegroundColor Cyan
        & npm --prefix $quartzRoot run quartz -- build
        if ($LASTEXITCODE -ne 0) { throw "Quartz build failed with exit code $LASTEXITCODE" }
    }

    if ($Push) {
        Write-Host ''
        git -C $quartzRoot add -A content
        git -C $quartzRoot diff --cached --quiet
        if ($LASTEXITCODE -eq 0) {
            Write-Host 'No content changes to publish.' -ForegroundColor Yellow
        } else {
            git -C $quartzRoot commit -m $Message
            if ($LASTEXITCODE -ne 0) { throw "git commit failed with exit code $LASTEXITCODE" }
            git -C $quartzRoot push origin v4
            if ($LASTEXITCODE -ne 0) { throw "git push failed with exit code $LASTEXITCODE" }
            Write-Host ''
            Write-Host 'Deployment triggered: https://github.com/Push1697/published_quartz_blog/actions' -ForegroundColor Green
            Write-Host 'Live at: https://push1697.github.io/published_quartz_blog' -ForegroundColor Green
        }
    }

    Write-Host ''
    Write-Host 'Garden publishing workflow completed successfully.' -ForegroundColor Green
} finally {
    if (Test-Path -LiteralPath $stagingRoot) {
        Remove-Item -LiteralPath $stagingRoot -Recurse -Force -ErrorAction SilentlyContinue
    }
    $mutex.ReleaseMutex()
    $mutex.Dispose()
}
