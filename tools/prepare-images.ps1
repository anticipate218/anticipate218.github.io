# Prepare web-optimized images from the original photo.png and bg.png.
#  - photo.png -> assets/img/avatar.jpg  (centered square crop, 512x512, JPEG q90)
#  - bg.png    -> assets/img/bg.jpg      (1920px wide, softened saturation, JPEG q82)
# Usage (from the site root):  powershell -ExecutionPolicy Bypass -File tools/prepare-images.ps1
[CmdletBinding()]
param(
  [int]$AvatarSize = 512,
  [int]$BackgroundWidth = 1920,
  [double]$Saturation = 0.72,
  [double]$Brightness = 0.95
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$out = Join-Path $root 'assets\img'
if (-not (Test-Path -LiteralPath $out)) { New-Item -ItemType Directory -Path $out | Out-Null }

function Get-JpegEncoder {
  [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' } | Select-Object -First 1
}

function Save-Jpeg([System.Drawing.Bitmap]$bitmap, [string]$path, [long]$quality) {
  $params = New-Object System.Drawing.Imaging.EncoderParameters 1
  $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), $quality
  $bitmap.Save($path, (Get-JpegEncoder), $params)
  $params.Dispose()
}

function New-Canvas([int]$w, [int]$h) {
  $bmp = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $g.Clear([System.Drawing.Color]::White)
  return @($bmp, $g)
}

# ---------- avatar ----------
$photoPath = Join-Path $root 'photo.png'
if (Test-Path -LiteralPath $photoPath) {
  $src = [System.Drawing.Image]::FromFile($photoPath)
  try {
    $side = [Math]::Min($src.Width, $src.Height)
    $x = [int][Math]::Round(($src.Width - $side) / 2.0)
    $y = [int][Math]::Round(($src.Height - $side) / 2.0)
    $canvas = New-Canvas $AvatarSize $AvatarSize
    $bmp = $canvas[0]; $g = $canvas[1]
    $attrs = New-Object System.Drawing.Imaging.ImageAttributes
    $attrs.SetWrapMode([System.Drawing.Drawing2D.WrapMode]::TileFlipXY)
    $g.DrawImage($src, (New-Object System.Drawing.Rectangle 0, 0, $AvatarSize, $AvatarSize), $x, $y, $side, $side, [System.Drawing.GraphicsUnit]::Pixel, $attrs)
    $g.Dispose()
    $dest = Join-Path $out 'avatar.jpg'
    Save-Jpeg $bmp $dest 90
    $bmp.Dispose(); $attrs.Dispose()
    Write-Host ("avatar.jpg  {0}x{0}  {1:N0} KB" -f $AvatarSize, ((Get-Item -LiteralPath $dest).Length / 1KB))
  } finally { $src.Dispose() }
} else {
  Write-Warning "photo.png not found, avatar skipped"
}

# ---------- background ----------
$bgPath = Join-Path $root 'bg.png'
if (Test-Path -LiteralPath $bgPath) {
  $src = [System.Drawing.Image]::FromFile($bgPath)
  try {
    $w = [Math]::Min($BackgroundWidth, $src.Width)
    $h = [int][Math]::Round($src.Height * $w / $src.Width)
    $canvas = New-Canvas $w $h
    $bmp = $canvas[0]; $g = $canvas[1]

    # Saturation + brightness colour matrix (luminance weights 0.3086 / 0.6094 / 0.0820)
    $s = $Saturation; $b = $Brightness
    $lr = 0.3086 * (1 - $s); $lg = 0.6094 * (1 - $s); $lb = 0.0820 * (1 - $s)
    $m = New-Object System.Drawing.Imaging.ColorMatrix
    $m.Matrix00 = [single](($lr + $s) * $b); $m.Matrix01 = [single]($lr * $b);        $m.Matrix02 = [single]($lr * $b)
    $m.Matrix10 = [single]($lg * $b);        $m.Matrix11 = [single](($lg + $s) * $b); $m.Matrix12 = [single]($lg * $b)
    $m.Matrix20 = [single]($lb * $b);        $m.Matrix21 = [single]($lb * $b);        $m.Matrix22 = [single](($lb + $s) * $b)
    $m.Matrix33 = 1; $m.Matrix44 = 1

    $attrs = New-Object System.Drawing.Imaging.ImageAttributes
    $attrs.SetColorMatrix($m)
    $attrs.SetWrapMode([System.Drawing.Drawing2D.WrapMode]::TileFlipXY)
    $g.DrawImage($src, (New-Object System.Drawing.Rectangle 0, 0, $w, $h), 0, 0, $src.Width, $src.Height, [System.Drawing.GraphicsUnit]::Pixel, $attrs)
    $g.Dispose()
    $dest = Join-Path $out 'bg.jpg'
    Save-Jpeg $bmp $dest 82
    $bmp.Dispose(); $attrs.Dispose()
    Write-Host ("bg.jpg      {0}x{1}  {2:N0} KB" -f $w, $h, ((Get-Item -LiteralPath $dest).Length / 1KB))
  } finally { $src.Dispose() }
} else {
  Write-Warning "bg.png not found, background skipped"
}
