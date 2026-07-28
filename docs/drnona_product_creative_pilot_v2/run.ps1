param(
    [switch]$Pilot,
    [switch]$Batch,
    [switch]$ConfirmBatch,
    [int]$MaxProducts = 0,
    [string]$Product = "",
    [string]$AssetType = "",
    [string]$Provider = "folder",
    [switch]$DryRun
)

$Arguments = @("-m", "src.cli")
if ($Pilot) { $Arguments += "--pilot" }
elseif ($Batch) { $Arguments += "--batch" }
else { $Arguments += "--plan-only" }
if ($ConfirmBatch) { $Arguments += "--confirm-batch" }
if ($MaxProducts -gt 0) { $Arguments += @("--max-products", "$MaxProducts") }
if ($Product) { $Arguments += @("--product", $Product) }
if ($AssetType) { $Arguments += @("--asset-type", $AssetType) }
if ($Provider) { $Arguments += @("--provider", $Provider) }
if ($DryRun) { $Arguments += "--dry-run" }

& python @Arguments
exit $LASTEXITCODE
