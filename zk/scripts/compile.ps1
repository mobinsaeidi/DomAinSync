$CIRCUIT_NAME = "whoisHashCheck"
$CIRCUIT_DIR = "../circuits"
$BUILD_DIR = "../build"

# ساخت پوشه خروجی
New-Item -ItemType Directory -Force -Path $BUILD_DIR | Out-Null

# اجرای circom
circom "$CIRCUIT_DIR/$CIRCUIT_NAME.circom" `
    --r1cs `
    --wasm `
    --sym `
    -o $BUILD_DIR

Write-Host "✅ Compilation done. Files are in $BUILD_DIR"
