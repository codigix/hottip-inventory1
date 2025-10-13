$filePath = "c:\Users\admin\Desktop\hottip-inventory-backend\hottip-inventory1\hottip-inventory1\hottip-inventory1\server\routes.ts"

# Read the file as an array of lines
$lines = Get-Content $filePath

# Process lines - comment out lines 1151-1178 (the old upload endpoint)
$output = @()
$inOldEndpoint = $false

for ($i = 0; $i -lt $lines.Count; $i++) {
    $lineNum = $i + 1
    $line = $lines[$i]
    
    # Start commenting from line 1151
    if ($lineNum -eq 1151 -and $line -match 'File uploads.*generic upload URL.*Mocked') {
        $inOldEndpoint = $true
        $output += '  // OLD ENDPOINT - REMOVED (now handled by file-upload-routes.ts)'
        $output += '  // ' + $line
        continue
    }
    
    # Continue commenting until line 1178
    if ($inOldEndpoint -and $lineNum -le 1178) {
        if ($line.Trim() -ne '') {
            $output += '  // ' + $line
        } else {
            $output += ''
        }
        if ($lineNum -eq 1178) {
            $inOldEndpoint = $false
        }
        continue
    }
    
    $output += $line
}

# Write back to file
$output | Set-Content $filePath -Encoding UTF8

Write-Host "Old upload endpoint commented out successfully (lines 1151-1178)"