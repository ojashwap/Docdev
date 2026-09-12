param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string]$OutFile
)

Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.Web

$zip = [System.IO.Compression.ZipFile]::OpenRead($Path)
try {
    $entry = $zip.Entries | Where-Object { $_.FullName -eq 'word/document.xml' }
    $reader = New-Object System.IO.StreamReader($entry.Open())
    $xml = $reader.ReadToEnd()
    $reader.Close()
}
finally {
    $zip.Dispose()
}

# Preserve structure: paragraphs and breaks become newlines, tabs become tabs
$xml = $xml -replace '</w:p>', "`n"
$xml = $xml -replace '<w:br[^>]*/>', "`n"
$xml = $xml -replace '<w:tab[^>]*/>', "`t"
$text = [System.Text.RegularExpressions.Regex]::Replace($xml, '<[^>]+>', '')
$text = [System.Web.HttpUtility]::HtmlDecode($text)

Set-Content -Path $OutFile -Value $text -Encoding UTF8
$lineCount = ($text -split "`n").Count
Write-Host "Extracted '$Path' -> '$OutFile' ($lineCount lines, $($text.Length) chars)"
