# Data Backup Script - Electron Edition
# Outputs structured lines: [STAGE] [PROGRESS] [LOG] [INPUT] [DONE] [ERROR]
# Backs up multiple folders into ONE single ZIP file

param(
    [string]$CleanupChoice = ""   # passed from Electron when user responds to cleanup prompt
)

# Configuration
$sourceFolders = @(
    "D:\Accounting",
    "D:\GST Return",
    "D:\Income Tax Return",
    "D:\Invoice Management",
    "D:\PAN Card",
    "D:\Procedures",
    "D:\Profession Tax",
    "D:\Project Report"
)

$primaryDestination   = "F:\Periodic Backup"
$secondaryDestination = "\\Hp-server\e\Periodic Backup"
$backupPrefix         = "backup_"
$retentionDays        = 180
$errorLog             = @()

function Format-TimeSpan {
    param([TimeSpan]$ts)
    if ($ts.TotalSeconds -lt 60)     { return "$([math]::Round($ts.TotalSeconds))s" }
    elseif ($ts.TotalMinutes -lt 60) { return "$([math]::Floor($ts.TotalMinutes))m $($ts.Seconds)s" }
    else                             { return "$([math]::Floor($ts.TotalHours))h $($ts.Minutes)m" }
}

function Emit {
    param([string]$Type, [string]$Msg)
    Write-Output "[$Type] $Msg"
    [Console]::Out.Flush()
}

Emit "LOG"   "Data Backup started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Emit "STAGE" "1|5|Copying Folders"

# ============================================
# STEP 1: COPY FOLDERS TO TEMP
# ============================================
$tempFolder = Join-Path $env:TEMP "BackupTemp_$(Get-Date -Format 'yyyyMMdd_HHmmss')"

try {
    New-Item -ItemType Directory -Path $tempFolder -Force | Out-Null

    $totalSize = 0
    foreach ($src in $sourceFolders) {
        if (Test-Path $src) {
            $sz = (Get-ChildItem $src -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
            $totalSize += $sz
        }
    }

    if ($totalSize -eq 0) { throw "No data found to backup" }

    $copiedSize = 0
    $startTime  = Get-Date
    $foldersProcessed = 0
    $foldersFailed    = 0

    foreach ($src in $sourceFolders) {
        $folderName = Split-Path $src -Leaf

        if (-not (Test-Path $src)) {
            $foldersFailed++
            Emit "LOG" "Skipped (not found): $folderName"
            continue
        }

        $itemCount = (Get-ChildItem $src -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object).Count
        if ($itemCount -eq 0) {
            Emit "LOG" "Skipped (empty): $folderName"
            continue
        }

        Emit "LOG" "Copying: $folderName"

        try {
            $destPath = Join-Path $tempFolder $folderName
            $files    = Get-ChildItem $src -Recurse -Force -ErrorAction SilentlyContinue
            New-Item -ItemType Directory -Path $destPath -Force | Out-Null

            foreach ($file in $files) {
                if ($file.PSIsContainer) {
                    $rel    = $file.FullName.Substring($src.Length)
                    $target = Join-Path $destPath $rel
                    New-Item -ItemType Directory -Path $target -Force -ErrorAction SilentlyContinue | Out-Null
                } else {
                    $rel       = $file.FullName.Substring($src.Length)
                    $targetFile = Join-Path $destPath $rel
                    $targetDir  = Split-Path $targetFile -Parent
                    if (-not (Test-Path $targetDir)) { New-Item -ItemType Directory -Path $targetDir -Force | Out-Null }
                    Copy-Item $file.FullName -Destination $targetFile -Force -ErrorAction SilentlyContinue
                    $copiedSize += $file.Length
                    $pct     = [math]::Round(($copiedSize / $totalSize) * 100)
                    $elapsed = ((Get-Date) - $startTime).TotalSeconds
                    $speed   = if ($elapsed -gt 0) { [math]::Round(($copiedSize / $elapsed) / 1MB, 2) } else { 0 }
                    Emit "PROGRESS" "1|$pct|$speed MB/s"
                }
            }
            $foldersProcessed++
        } catch {
            $foldersFailed++
            $errorLog += "Failed to copy ${folderName}: $($_.Exception.Message)"
            Emit "LOG" "ERROR copying ${folderName}: $($_.Exception.Message)"
        }
    }

    $step1Time = Format-TimeSpan ((Get-Date) - $startTime)
    Emit "PROGRESS" "1|100|0 MB/s"
    Emit "LOG" "Folders done — $foldersProcessed copied, $foldersFailed skipped ($step1Time)"

    if ($foldersProcessed -eq 0) { throw "No folders were available to backup" }

} catch {
    $msg = $_.Exception.Message
    Emit "ERROR" "Step 1 — $msg"
    Remove-Item $tempFolder -Recurse -Force -ErrorAction SilentlyContinue
    exit 1
}

# ============================================
# STEP 2: ZIP CREATION
# ============================================
Emit "STAGE" "2|5|Creating ZIP"

$timestamp      = Get-Date -Format "yyyy-MM-dd"
$backupFileName = "$backupPrefix$timestamp.zip"
$tempZipPath    = Join-Path $env:TEMP $backupFileName

try {
    $step2Start = Get-Date
    Emit "LOG" "Compressing to $backupFileName …"
    Emit "PROGRESS" "2|1|"

    $compressScript = {
        param($Source, $Dest)
        Compress-Archive -Path "$Source\*" -DestinationPath $Dest -CompressionLevel Optimal -Force
    }

    $job = Start-Job -ScriptBlock $compressScript -ArgumentList $tempFolder, $tempZipPath
    $estimatedFinalSize = $totalSize * 0.3

    while ($job.State -eq 'Running') {
        Start-Sleep -Milliseconds 600
        if (Test-Path $tempZipPath) {
            $curSize = (Get-Item $tempZipPath).Length
            $pct     = if ($estimatedFinalSize -gt 0) { [math]::Min(97, [math]::Round(($curSize / $estimatedFinalSize) * 100)) } else { 50 }
            Emit "PROGRESS" "2|$pct|"
        }
        if (((Get-Date) - $step2Start).TotalMinutes -gt 30) {
            Stop-Job $job; Remove-Job $job -Force
            throw "ZIP creation timeout (>30 min)"
        }
    }

    Wait-Job $job | Out-Null

    if ($job.State -eq 'Completed') {
        Receive-Job $job -ErrorAction SilentlyContinue | Out-Null
        Remove-Job $job -Force

        if (-not (Test-Path $tempZipPath)) { throw "ZIP file not created" }
        $finalSize = (Get-Item $tempZipPath).Length
        if ($finalSize -eq 0)             { throw "ZIP file is empty" }

        $zipMB      = [math]::Round($finalSize / 1MB, 2)
        $step2Time  = Format-TimeSpan ((Get-Date) - $step2Start)
        Emit "PROGRESS" "2|100|"
        Emit "LOG" "ZIP created — $zipMB MB ($step2Time)"
    } else {
        $jobErr = Receive-Job $job -ErrorAction SilentlyContinue
        Remove-Job $job -Force
        throw "Compression failed: $jobErr"
    }

} catch {
    Emit "ERROR" "Step 2 — $($_.Exception.Message)"
    Remove-Item $tempFolder -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item $tempZipPath -Force -ErrorAction SilentlyContinue
    exit 1
} finally {
    Remove-Item $tempFolder -Recurse -Force -ErrorAction SilentlyContinue
}

# ============================================
# STEP 3: SELECT DESTINATION
# ============================================
Emit "STAGE" "3|5|Selecting Destination"
Emit "PROGRESS" "3|50|"

$destinationFolder = $null

if (Test-Path $primaryDestination -ErrorAction SilentlyContinue) {
    $destinationFolder = $primaryDestination
    Emit "LOG" "Destination: $primaryDestination (Primary — Local/External drive)"
} elseif (Test-Path $secondaryDestination -ErrorAction SilentlyContinue) {
    $destinationFolder = $secondaryDestination
    Emit "LOG" "Destination: $secondaryDestination (Secondary — Network server)"
} else {
    Emit "ERROR" "Step 3 — No destination available (F: drive and network server both unreachable)"
    Remove-Item $tempZipPath -Force -ErrorAction SilentlyContinue
    exit 1
}

if (-not (Test-Path $destinationFolder)) {
    try { New-Item -ItemType Directory $destinationFolder -Force | Out-Null }
    catch {
        Emit "ERROR" "Step 3 — Cannot create destination: $($_.Exception.Message)"
        exit 1
    }
}

Emit "PROGRESS" "3|100|"

# ============================================
# STEP 4: COPY ZIP TO DESTINATION
# ============================================
Emit "STAGE" "4|5|Copying to Destination"

$backupFilePath = Join-Path $destinationFolder $backupFileName

if (Test-Path $backupFilePath) {
    Emit "LOG" "Backup already exists at destination — skipped copy"
    Emit "PROGRESS" "4|100|"
    Remove-Item $tempZipPath -Force -ErrorAction SilentlyContinue
} else {
    try {
        $step4Start  = Get-Date
        $sourceFile  = Get-Item $tempZipPath
        $totalSz     = $sourceFile.Length
        $bufferSize  = 1MB
        $copiedSz    = 0
        $lastUpdate  = Get-Date

        $srcStream  = [System.IO.File]::OpenRead($tempZipPath)
        $dstStream  = [System.IO.File]::Create($backupFilePath)
        $buffer     = New-Object byte[] $bufferSize

        Emit "PROGRESS" "4|1|"

        while (($read = $srcStream.Read($buffer, 0, $buffer.Length)) -gt 0) {
            $dstStream.Write($buffer, 0, $read)
            $copiedSz += $read
            $pct       = [math]::Round(($copiedSz / $totalSz) * 100)
            $elapsed   = ((Get-Date) - $step4Start).TotalSeconds
            $now       = Get-Date

            if (($now - $lastUpdate).TotalSeconds -ge 2 -or $copiedSz -eq $totalSz) {
                $lastUpdate = $now
                $speed      = if ($elapsed -gt 0) { [math]::Round(($copiedSz / $elapsed) / 1MB, 2) } else { 0 }
                $remainSec  = if ($speed -gt 0 -and $copiedSz -lt $totalSz) { [math]::Round(($totalSz - $copiedSz) / ($speed * 1MB)) } else { 0 }
                $eta        = if ($remainSec -gt 0) { "ETA $remainSec s" } else { "" }
                Emit "PROGRESS" "4|$pct|$speed MB/s $eta"
            }
        }

        $srcStream.Close(); $dstStream.Close()

        $step4Time = Format-TimeSpan ((Get-Date) - $step4Start)
        $finalMB   = [math]::Round((Get-Item $backupFilePath).Length / 1MB, 2)
        Emit "PROGRESS" "4|100|"
        Emit "LOG" "Copied to destination — $finalMB MB ($step4Time)"
        Remove-Item $tempZipPath -Force -ErrorAction SilentlyContinue

    } catch {
        if ($srcStream) { $srcStream.Close() }
        if ($dstStream) { $dstStream.Close() }
        Remove-Item $tempZipPath -Force -ErrorAction SilentlyContinue
        Emit "ERROR" "Step 4 — $($_.Exception.Message)"
        exit 1
    }
}

# ============================================
# STEP 5: OLD BACKUP CLEANUP
# ============================================
Emit "STAGE" "5|5|Cleanup Old Backups"
Emit "PROGRESS" "5|10|"

try {
    $cutoff     = (Get-Date).AddDays(-$retentionDays)
    $oldBackups = Get-ChildItem $destinationFolder -Filter "$backupPrefix*.zip" |
                  Where-Object { $_.LastWriteTime -lt $cutoff }

    if ($oldBackups.Count -gt 0) {
        # Build JSON list of old backups and send INPUT request to Electron
        $list = $oldBackups | ForEach-Object {
            "$($_.Name)|$($_.LastWriteTime.ToString('yyyy-MM-dd'))|$([math]::Round($_.Length/1MB,2))"
        }
        $listStr = $list -join ";"
        Emit "INPUT" "CLEANUP|$($oldBackups.Count)|$listStr"

        # Wait for CleanupChoice to arrive via stdin (Electron writes it)
        if ([string]::IsNullOrWhiteSpace($CleanupChoice)) {
            $CleanupChoice = [Console]::In.ReadLine()
        }

        switch ($CleanupChoice.Trim()) {
            "1" {
                Emit "LOG" "Deleting all $($oldBackups.Count) old backup(s)…"
                foreach ($f in $oldBackups) {
                    Remove-Item $f.FullName -Force
                    Emit "LOG" "Deleted: $($f.Name)"
                }
                Emit "LOG" "Cleanup done — removed $($oldBackups.Count) backup(s)"
            }
            "2" {
                Emit "LOG" "Cleanup skipped — all old backups kept"
            }
            default {
                Emit "LOG" "Cleanup skipped — no valid choice"
            }
        }
    } else {
        Emit "LOG" "No old backups found (retention: $retentionDays days)"
    }

    Emit "PROGRESS" "5|100|"

} catch {
    $errorLog += "Cleanup warning: $($_.Exception.Message)"
    Emit "LOG" "Cleanup warning: $($_.Exception.Message)"
    Emit "PROGRESS" "5|100|"
}

# ============================================
# FINAL SUMMARY
# ============================================
if ($errorLog.Count -eq 0) {
    Emit "DONE" "SUCCESS|$destinationFolder|$backupFileName"
} else {
    $warnings = $errorLog -join " | "
    Emit "DONE" "WARNINGS|$warnings"
}


