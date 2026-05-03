# PowerShell script to create PNG icons with UOMe text
Add-Type -AssemblyName System.Drawing

function Create-Icon {
    param(
        [int]$Size,
        [string]$Filename
    )
    
    # Create bitmap
    $bitmap = New-Object System.Drawing.Bitmap($Size, $Size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    
    # Set high quality rendering
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias
    
    # Fill background with black
    $blackBrush = [System.Drawing.Brushes]::Black
    $graphics.FillRectangle($blackBrush, 0, 0, $Size, $Size)
    
    # Draw white text "UOMe"
    $text = "UOMe"
    $fontSize = [int]($Size * 0.3)
    $font = New-Object System.Drawing.Font("Arial", $fontSize, [System.Drawing.FontStyle]::Bold)
    $whiteBrush = [System.Drawing.Brushes]::White
    
    # Measure text to center it
    $textSize = $graphics.MeasureString($text, $font)
    $x = ($Size - $textSize.Width) / 2
    $y = ($Size - $textSize.Height) / 2
    
    # Draw the text
    $graphics.DrawString($text, $font, $whiteBrush, $x, $y)
    
    # Save the image
    $filepath = Join-Path "public" $Filename
    $bitmap.Save($filepath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    # Cleanup
    $graphics.Dispose()
    $bitmap.Dispose()
    $font.Dispose()
    
    Write-Host "Created $filepath" -ForegroundColor Green
}

Write-Host "`nGenerating PWA icons with 'UOMe' text..." -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

try {
    Create-Icon -Size 192 -Filename "pwa-192x192.png"
    Create-Icon -Size 512 -Filename "pwa-512x512.png"
    Create-Icon -Size 180 -Filename "apple-touch-icon.png"
    
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "All icons generated successfully!" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Cyan
    
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Rebuild your frontend (npm run build)" -ForegroundColor White
    Write-Host "2. Redeploy the app" -ForegroundColor White
    Write-Host "3. On your phone: uninstall PWA, clear cache, reinstall`n" -ForegroundColor White
}
catch {
    Write-Host "`nError: $_" -ForegroundColor Red
    Write-Host "Please ensure you have .NET Framework installed.`n" -ForegroundColor Yellow
}
