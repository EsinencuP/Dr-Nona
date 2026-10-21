[CmdletBinding()]
param(
  [string]$CatalogRoot,
  [string]$CrmRoot,
  [string]$OutputRoot
)

$ErrorActionPreference = "Stop"
$scriptRoot = $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($CatalogRoot)) {
  $CatalogRoot = (Resolve-Path (Join-Path $scriptRoot "../..")).Path
}
if ([string]::IsNullOrWhiteSpace($CrmRoot)) {
  $crmCandidate = Join-Path $scriptRoot "../../../Dr-Nona-CRM"
  if (-not (Test-Path -LiteralPath $crmCandidate)) { $crmCandidate = Join-Path $scriptRoot "../../../Dr.Nona.CRM" }
  $CrmRoot = (Resolve-Path -LiteralPath $crmCandidate).Path
}
if ([string]::IsNullOrWhiteSpace($OutputRoot)) {
  $OutputRoot = Join-Path (Resolve-Path (Join-Path $scriptRoot "../..")).Path "graphify-out"
}
$catalog = (Resolve-Path $CatalogRoot).Path
$crm = (Resolve-Path $CrmRoot).Path
$output = [IO.Path]::GetFullPath($OutputRoot)
$scratch = Join-Path $catalog "artifacts/graphify-build"
$scratch = [IO.Path]::GetFullPath($scratch)
if (-not $scratch.StartsWith($catalog.TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw "Scratch path must stay inside catalog: $scratch" }
$catalogOut = Join-Path $scratch "catalog"
$crmOut = Join-Path $scratch "crm"
$merged = Join-Path $output "graph.json"
$links = Join-Path $catalog "tools/graphify/cross-repo-links.json"
$mergedScratch = Join-Path $scratch "merged-graph.json"

if (-not (Test-Path (Join-Path $catalog "package.json"))) { throw "Catalog root is not a project: $catalog" }
if (-not (Test-Path (Join-Path $crm "database/schema.prisma"))) { throw "CRM database schema is missing: $crm" }

if (Test-Path -LiteralPath $scratch) {
  Remove-Item -LiteralPath $scratch -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $scratch, $output | Out-Null
& graphify extract $catalog --code-only --no-cluster --force --out $catalogOut --as catalog
if ($LASTEXITCODE -ne 0) { throw "Catalog graph extraction failed with exit code $LASTEXITCODE" }
& graphify extract $crm --code-only --no-cluster --force --out $crmOut --as crm
if ($LASTEXITCODE -ne 0) { throw "CRM graph extraction failed with exit code $LASTEXITCODE" }

$catalogGraph = Join-Path $catalogOut "graphify-out/graph.json"
$crmGraph = Join-Path $crmOut "graphify-out/graph.json"
& graphify merge-graphs $catalogGraph $crmGraph --out $mergedScratch
if ($LASTEXITCODE -ne 0) { throw "Graph merge failed with exit code $LASTEXITCODE" }
node (Join-Path $scriptRoot "augment-cross-repo-graph.mjs") $mergedScratch $links
if ($LASTEXITCODE -ne 0) { throw "Cross-repo graph augmentation failed with exit code $LASTEXITCODE" }
# graphify writes clustered output relative to its working directory, even when
# --graph points elsewhere. Keep it isolated from the prior canonical graph so
# removing real source symbols does not trigger its partial-extraction guard.
Push-Location -LiteralPath $scratch
try {
  & graphify cluster-only --graph $mergedScratch --no-label
  if ($LASTEXITCODE -ne 0) { throw "Cross-repo graph clustering failed with exit code $LASTEXITCODE" }
} finally {
  Pop-Location
}
$clusteredOut = Join-Path $scratch "graphify-out"
$clusteredGraph = Join-Path $clusteredOut "graph.json"
if (-not (Test-Path -LiteralPath $clusteredGraph)) { throw "Clustered cross-repo graph was not produced: $clusteredGraph" }
Copy-Item -LiteralPath $clusteredGraph -Destination $merged -Force
foreach ($name in @("GRAPH_REPORT.md", "graph.html", ".graphify_analysis.json")) {
  $source = Join-Path $clusteredOut $name
  if (Test-Path -LiteralPath $source) { Copy-Item -LiteralPath $source -Destination (Join-Path $output $name) -Force }
}
Remove-Item -LiteralPath $scratch -Recurse -Force

Write-Host "Cross-repo graph ready: $merged"
