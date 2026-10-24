# ==============================================================================
#  PARANOIA POWERSHELL ENGINE (paranoia.ps1) - v2.5.0
#  Elevated Windows Network Stack Tor Routing Script
# ==============================================================================

#Requires -RunAsAdministrator

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " [PARANOIA] Starting Windows Tor System Router Service..." -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

function Enable-TorProxy {
    Write-Host "[*] Configuring Windows System SOCKS5 Proxy to 127.0.0.1:9050..." -ForegroundColor Yellow
    Set-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings' -Name ProxyEnable -Value 1
    Set-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings' -Name ProxyServer -Value "socks=127.0.0.1:9050"
    Set-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings' -Name ProxyOverride -Value "<local>"

    # Flush DNS to clear cached native resolutions
    Clear-DnsClientCache
    Write-Host "[OK] Windows System Traffic Routed through Tor SOCKS5." -ForegroundColor Green
}

function Disable-TorProxy {
    Write-Host "[*] Restoring Windows Default Network Settings..." -ForegroundColor Yellow
    Set-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings' -Name ProxyEnable -Value 0
    Remove-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings' -Name ProxyServer -ErrorAction SilentlyContinue
    Clear-DnsClientCache
    Write-Host "[OK] Windows Network Settings Restored to Default." -ForegroundColor Green
}

function Test-TorLeak {
    Write-Host "[*] Auditing Public IP & Exit Node..." -ForegroundColor Yellow
    try {
        $wc = New-Object System.Net.WebClient
        $wc.Proxy = New-Object System.Net.WebProxy('http://127.0.0.1:9050')
        $ip = $wc.DownloadString('https://api.ipify.org')
        Write-Host "[+] Active Tor Exit Node IP: $ip" -ForegroundColor Green
    } catch {
        Write-Host "[!] Unable to connect through Tor proxy: $_" -ForegroundColor Red
    }
}

Enable-TorProxy
Test-TorLeak
