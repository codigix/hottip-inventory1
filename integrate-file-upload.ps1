$filePath = "c:\Users\admin\Desktop\hottip-inventory-backend\hottip-inventory1\hottip-inventory1\hottip-inventory1\server\routes.ts"

# Read the file as an array of lines
$lines = Get-Content $filePath

# Process lines
$output = @()
$importAdded = $false
$callAdded = $false

for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    
    # Add import after registerSalesRoutes import
    if (-not $importAdded -and $line -match 'import \{ registerSalesRoutes \} from "./sales-routes-registry";') {
        $output += $line
        $output += 'import { registerFileUploadRoutes } from "./file-upload-routes";'
        $importAdded = $true
        continue
    }
    
    # Add function call before httpServer creation
    if (-not $callAdded -and $line -match '^\s+const httpServer = createServer\(app\);') {
        $output += '  registerFileUploadRoutes(app, requireAuth);'
        $output += ''
        $callAdded = $true
    }
    
    $output += $line
}

# Write back to file
$output | Set-Content $filePath -Encoding UTF8

Write-Host "Import added: $importAdded"
Write-Host "Function call added: $callAdded"
Write-Host "File updated successfully"