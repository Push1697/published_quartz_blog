param(
    [string]$VaultPath = "c:\Users\Pushpendra\Documents\obsidian\zettelkasten"
)

$allFiles = Get-ChildItem -Path $VaultPath -Recurse -Include *.md
$fileNames = $allFiles.Name
$fileBaseNames = $allFiles.BaseName

foreach ($file in $allFiles) {
    $content = Get-Content $file.FullName -Raw
    # Regex to find [[Link]] pattern
    $matches = [regex]::Matches($content, "\[\[(.*?)\]\]")
    
    foreach ($match in $matches) {
        $linkText = $match.Groups[1].Value.Split("|")[0].Trim() # Handle [[Link|Alias]]
        $linkBase = $linkText.Split("/")[-1] # Handle Folder/Link
        
        # Simple check: does a file with this basename exist?
        if ($fileBaseNames -notcontains $linkBase) {
            Write-Host "Broken Link in $($file.Name): [[$linkText]]" -ForegroundColor Red
        }
    }
}
