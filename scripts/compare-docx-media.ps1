param(
    [Parameter(Mandatory = $true)][string]$PathA,
    [Parameter(Mandatory = $true)][string]$PathB
)

Add-Type -AssemblyName System.IO.Compression.FileSystem

function Get-DocxMedia {
    param([string]$Path)
    $zip = [System.IO.Compression.ZipFile]::OpenRead($Path)
    $result = @{}
    foreach ($e in $zip.Entries) {
        if ($e.FullName -like 'word/media/*') {
            $stream = $e.Open()
            $ms = New-Object System.IO.MemoryStream
            $stream.CopyTo($ms)
            $stream.Close()
            $hash = [System.BitConverter]::ToString(
                [System.Security.Cryptography.SHA256]::Create().ComputeHash($ms.ToArray())
            ).Replace('-', '')
            $result[$e.FullName] = @{ Len = $e.Length; Hash = $hash }
            $ms.Dispose()
        }
    }
    $zip.Dispose()
    return $result
}

$a = Get-DocxMedia -Path $PathA
$b = Get-DocxMedia -Path $PathB

Write-Host "=== Media in A: $($a.Count) files, B: $($b.Count) files ==="
$allKeys = ($a.Keys + $b.Keys) | Sort-Object -Unique
foreach ($k in $allKeys) {
    $ha = if ($a.ContainsKey($k)) { $a[$k].Hash } else { 'MISSING' }
    $hb = if ($b.ContainsKey($k)) { $b[$k].Hash } else { 'MISSING' }
    $status = if ($ha -eq $hb) { 'SAME' } else { 'DIFF' }
    Write-Host ("{0,-6} {1,-24} A={2} B={3}" -f $status, $k, $ha.Substring(0, [Math]::Min(8, $ha.Length)), $hb.Substring(0, [Math]::Min(8, $hb.Length)))
}
