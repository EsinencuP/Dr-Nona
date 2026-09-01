[CmdletBinding()]
param(
    [switch]$Execute
)

$ErrorActionPreference = "Stop"

$projectRoot = [System.IO.Path]::GetFullPath($PSScriptRoot)
$projectPrefix = $projectRoot.TrimEnd([System.IO.Path]::DirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar

function Resolve-ProjectTarget {
    param([Parameter(Mandatory)][string]$RelativePath)

    $resolved = [System.IO.Path]::GetFullPath((Join-Path -Path $projectRoot -ChildPath $RelativePath))
    if ($resolved -eq $projectRoot -or -not $resolved.StartsWith($projectPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing target outside the project: $resolved"
    }

    return $resolved
}

function Remove-ProjectTarget {
    param([Parameter(Mandatory)][string]$RelativePath)

    $resolved = Resolve-ProjectTarget -RelativePath $RelativePath
    if (-not (Test-Path -LiteralPath $resolved)) {
        Write-Host "Skip (missing): $RelativePath"
        return
    }

    if (-not $Execute) {
        Write-Host "Would remove: $RelativePath"
        return
    }

    $item = Get-Item -LiteralPath $resolved -Force
    if ($item.PSIsContainer) {
        Remove-Item -LiteralPath $resolved -Recurse -Force
    }
    else {
        Remove-Item -LiteralPath $resolved -Force
    }
    Write-Host "Removed: $RelativePath"
}

$targets = @(
    "dist",
    "coverage",
    "playwright-report",
    "test-results",
    "src/data/runtime-content.json",
    "src/data/seo-manifest.json",
    "qa_audit_report.md",
    "exports"
)

foreach ($target in $targets) {
    Remove-ProjectTarget -RelativePath $target
}

$agentsRoot = Resolve-ProjectTarget -RelativePath ".agents"
if (Test-Path -LiteralPath $agentsRoot) {
    foreach ($directory in Get-ChildItem -LiteralPath $agentsRoot -Directory -Force) {
        $relativePath = ".agents/$($directory.Name)"
        Remove-ProjectTarget -RelativePath $relativePath
    }
}
else {
    Write-Host "Skip (missing): .agents"
}

if (-not $Execute) {
    Write-Host "Dry run complete. Re-run with -Execute to remove the listed targets."
}
