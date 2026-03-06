<# :
@echo off
setlocal
cd /d "%~dp0"
echo Starting installation...

:: Pass the script path securely using a defined batch variable, avoiding single-quote parsing bugs in PowerShell Invoke-Expression
set "INSTALL_DIR=%~dp0"
set "BAT_FILE=%~f0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "iex ((Get-Content -LiteralPath $env:BAT_FILE -Raw))"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Installation failed! Please check the error messages above.
    pause
)
exit /b %ERRORLEVEL%
#>

# --- PowerShell Script Starts Here ---
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName Microsoft.VisualBasic

$ErrorActionPreference = "Stop"

try {
    $HostName = "com.example.youtubetobrave"
    $InstallDir = "$env:LOCALAPPDATA\YouTubeToBrave"
    $ManifestPath = "$InstallDir\$HostName.json"
    $ExtensionName = "YouTube to Brave"
    
    # Create installation directory if it doesn't exist
    if (-not (Test-Path -Path $InstallDir)) {
        New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
    }

    # Auto-Detect Extension ID
    $ChromeExtPath = "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Extensions"
    $ExtID = $null
    $SourceScriptPath = $null

    if (Test-Path -Path $ChromeExtPath) {
        $ExtDirs = Get-ChildItem -Path $ChromeExtPath -Directory
        foreach ($ExtDir in $ExtDirs) {
            $VersionDirs = Get-ChildItem -Path $ExtDir.FullName -Directory
            foreach ($VersionDir in $VersionDirs) {
                $ManifestFile = Join-Path -Path $VersionDir.FullName -ChildPath "manifest.json"
                if (Test-Path -Path $ManifestFile) {
                    try {
                        $ManifestContent = Get-Content -Path $ManifestFile -Raw | ConvertFrom-Json
                        if ($ManifestContent.name -match $ExtensionName -or $ManifestContent.short_name -match $ExtensionName) {
                            $ExtID = $ExtDir.Name
                            $PossibleScriptPath = Join-Path -Path $VersionDir.FullName -ChildPath "native-host\script.py"
                            if (Test-Path -Path $PossibleScriptPath) {
                                $SourceScriptPath = $PossibleScriptPath
                            }
                            break
                        }
                    } catch {}
                }
            }
            if ($ExtID) { break }
        }
    }

    # If we couldn't find the source script via Chrome extensions, check if it's next to the installer
    if (-not $SourceScriptPath) {
        $FallbackDir = $env:INSTALL_DIR
        $PossibleScriptPath = Join-Path -Path $FallbackDir -ChildPath "script.py"
        if (Test-Path -Path $PossibleScriptPath) {
            $SourceScriptPath = $PossibleScriptPath
        }
    }

    if (-not $ExtID) {
        $ExtID = [Microsoft.VisualBasic.Interaction]::InputBox("Could not automatically detect the YouTube to Brave Extension ID (common if loaded as 'Unpacked' during development).`n`nPlease open chrome://extensions, copy the ID for 'YouTube to Brave', and paste it below:", "Extension ID Required", "")
    }

    $ExtID = $ExtID.Trim()
    if ([string]::IsNullOrWhiteSpace($ExtID) -or -not ($ExtID -match "^[a-p]{32}$")) {
        Throw "Could not proceed: A valid 32-character Chrome Extension ID (letters a-p only) is required."
    }

    if (-not $SourceScriptPath) {
        Throw "Could not proceed: script.py was not found."
    }

    # Copy script.py
    $TargetScriptPath = Join-Path -Path $InstallDir -ChildPath "script.py"
    Copy-Item -Path $SourceScriptPath -Destination $TargetScriptPath -Force

    # Generate Host.bat wrapper for Windows Native Messaging
    $HostBatPath = Join-Path -Path $InstallDir -ChildPath "host.bat"
    $HostBatContent = "@echo off`r`npython `"%~dp0script.py`" %*"
    Set-Content -Path $HostBatPath -Value $HostBatContent -Encoding ASCII

    # Generate Manifest JSON
    $EscapedHostBatPath = $HostBatPath -replace '\\', '\\'
    
    $ManifestJson = @"
{
  "name": "$HostName",
  "description": "YouTube to Brave Native Host",
  "path": "$EscapedHostBatPath",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://$ExtID/"
  ]
}
"@
    Set-Content -Path $ManifestPath -Value $ManifestJson -Encoding UTF8

    # Write to Registry (HKCU)
    $RegPath = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\$HostName"
    if (-not (Test-Path $RegPath)) {
        New-Item -Path $RegPath -Force | Out-Null
    }
    Set-ItemProperty -Path $RegPath -Name "(Default)" -Value $ManifestPath

    [System.Windows.Forms.MessageBox]::Show("YouTube to Brave native host installed successfully!`n`nExtension ID: $ExtID", "Installation Complete", 0, [System.Windows.Forms.MessageBoxIcon]::Information)
    exit 0
} catch {
    [System.Windows.Forms.MessageBox]::Show("Installation failed:`n$_", "Installation Error", 0, [System.Windows.Forms.MessageBoxIcon]::Error)
    exit 1
}
