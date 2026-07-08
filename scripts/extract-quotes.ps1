param(
    [string]$ContentDir = "src/content/books",
    [string]$OutputFile = "src/data/extracted-quotes.json"
)

$projectRoot = "C:\Users\Windows_OS\Downloads\Telegram Desktop\book-src"
$contentFullPath = Join-Path $projectRoot $ContentDir
$outputFullPath = Join-Path $projectRoot $OutputFile

$bookNames = @{
    "abu-yahya" = [char]0x645 + [char]0x62C + [char]0x645 + [char]0x648 + [char]0x639 + [char]0x20 + [char]0x623 + [char]0x639 + [char]0x645 + [char]0x627 + [char]0x644 + [char]0x20 + [char]0x627 + [char]0x644 + [char]0x634 + [char]0x64A + [char]0x62E + [char]0x20 + [char]0x623 + [char]0x628 + [char]0x64A + [char]0x20 + [char]0x64A + [char]0x62D + [char]0x64A + [char]0x649 + [char]0x20 + [char]0x627 + [char]0x644 + [char]0x644 + [char]0x64A + [char]0x628 + [char]0x64A
    "atiyatullah" = [char]0x645 + [char]0x62C + [char]0x645 + [char]0x648 + [char]0x639 + [char]0x20 + [char]0x623 + [char]0x639 + [char]0x645 + [char]0x627 + [char]0x644 + [char]0x20 + [char]0x627 + [char]0x644 + [char]0x634 + [char]0x64A + [char]0x62E + [char]0x20 + [char]0x639 + [char]0x637 + [char]0x64A + [char]0x629 + [char]0x20 + [char]0x627 + [char]0x644 + [char]0x644 + [char]0x647 + [char]0x20 + [char]0x627 + [char]0x644 + [char]0x644 + [char]0x64A + [char]0x628 + [char]0x64A
}

$urlPrefixes = @{
    "abu-yahya" = "/book/abu-yahya"
    "atiyatullah" = "/book/atiyatullah"
}

# Skip patterns for unwanted content
$skipPatterns = @(
    '^\s*$',
    'text-center',
    '^الحمد لله',
    '^وبعد',
    '^۞',
    'page-break-marker',
    'subsections-toc'
)

function Strip-Html {
    param([string]$html)
    $text = [regex]::Replace($html, '<[^>]+>', ' ')
    $text = [regex]::Replace($text, '&nbsp;', ' ')
    $text = [regex]::Replace($text, '&amp;', '&')
    $text = [regex]::Replace($text, '&lt;', '<')
    $text = [regex]::Replace($text, '&gt;', '>')
    $text = [regex]::Replace($text, '&quot;', '"')
    $text = [regex]::Replace($text, '&#39;', "'")
    $text = [regex]::Replace($text, '\s+', ' ')
    return $text.Trim()
}

$allQuotes = @()
$files = Get-ChildItem -Path $contentFullPath -Filter "*.md" -Recurse
$totalFiles = $files.Count
$processed = 0

foreach ($file in $files) {
    $processed++
    if ($processed % 100 -eq 0) {
        Write-Host "Processing $processed / $totalFiles ..."
    }
    
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    
    if ($content -match '^---\s*\n(.*?)\n---\s*\n(.*)$') {
        $yamlBlock = $matches[1]
        $body = $matches[2]
    } else {
        continue
    }
    
    $title = ""
    $author = ""
    $slug = ""
    $order = 0
    
    if ($yamlBlock -match 'title:\s*"(.+?)"') { $title = $matches[1] }
    if ($yamlBlock -match "title:\s*'(.+?)'") { $title = $matches[1] }
    if ($yamlBlock -match 'author:\s*"(.+?)"') { $author = $matches[1] }
    if ($yamlBlock -match 'slug:\s*"(.+?)"') { $slug = $matches[1] }
    if ($yamlBlock -match 'order:\s*(\d+)') { $order = [int]$matches[1] }
    
    if ([string]::IsNullOrEmpty($slug)) { continue }
    
    $pageNum = 0
    if ($body -match ([regex]::Escape([char]0x627 + [char]0x644 + [char]0x635 + [char]0x641 + [char]0x62D + [char]0x629 + ':\s*(\d+)'))) {
        $pageNum = [int]$matches[1]
    }
    
    $bookName = $bookNames[$author]
    $urlPrefix = $urlPrefixes[$author]
    if ([string]::IsNullOrEmpty($bookName)) { continue }
    
    $paragraphBlocks = [regex]::Matches($body, '<div class="paragraph-wrap"[^>]*>(.*?)</div>', [System.Text.RegularExpressions.RegexOptions]::Singleline)
    
    $bestText = ""
    
    foreach ($block in $paragraphBlocks) {
        $blockHtml = $block.Groups[1].Value
        
        if ($blockHtml -match 'page-break-marker') { continue }
        if ($blockHtml -match 'subsections-toc') { continue }
        
        $pMatches = [regex]::Matches($blockHtml, '<p[^>]*>(.*?)</p>', [System.Text.RegularExpressions.RegexOptions]::Singleline)
        
        foreach ($pm in $pMatches) {
            $pText = $pm.Groups[1].Value
            $pText = Strip-Html $pText
            
            if ($pText.Length -lt 40) { continue }
            if ($pText.Length -gt 500) { continue }
            
            $arabicChars = [regex]::Matches($pText, '[\u0600-\u06FF\u0750-\u077F]').Count
            if ($arabicChars -lt 20) { continue }
            
            $verseChars = [regex]::Matches($pText, '\uFEF4|\uFEF3|\uFEF2|\uFEF1|\u06D6|\u06D7').Count
            if ($verseChars -gt 10) { continue }
            
            $skip = $false
            foreach ($pattern in $skipPatterns) {
                if ($pText -match $pattern) { $skip = $true; break }
            }
            if ($skip) { continue }
            
            $bestText = $pText
            break
        }
        
        if ($bestText.Length -gt 0) { break }
    }
    
    if ($bestText.Length -gt 0) {
        $url = "$urlPrefix/$slug/"
        $allQuotes += [PSCustomObject]@{
            text = $bestText
            book = $bookName
            title = $title
            author = $author
            page = $pageNum
            order = $order
            url = $url
            slug = $slug
        }
    }
}

$allQuotes = $allQuotes | Sort-Object author, order

Write-Host "Extracted $($allQuotes.Count) quotes from $totalFiles files."

$outputDir = Split-Path $outputFullPath -Parent
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-File -Encoding UTF8
}

$allQuotes | ConvertTo-Json -Depth 3 | Out-File -FilePath $outputFullPath -Encoding UTF8

Write-Host "Saved to: $outputFullPath"
