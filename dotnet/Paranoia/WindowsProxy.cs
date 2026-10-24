using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using Microsoft.Win32;

namespace Paranoia
{
    public static class WindowsProxy
    {
        private const int INTERNET_OPTION_SETTINGS_CHANGED = 39;
        private const int INTERNET_OPTION_REFRESH = 37;

        [DllImport("wininet.dll", SetLastError = true)]
        private static extern bool InternetSetOption(IntPtr hInternet, int dwOption, IntPtr lpBuffer, int dwBufferLength);

        [DllImport("dnsapi.dll", EntryPoint = "DnsFlushResolverCache")]
        private static extern int DnsFlushResolverCache();

        private const string RegistryKeyPath = @"Software\Microsoft\Windows\CurrentVersion\Internet Settings";

        public static bool EnableSystemTorProxy(string proxyServer = "socks=127.0.0.1:9050")
        {
            try
            {
                using var key = Registry.CurrentUser.OpenSubKey(RegistryKeyPath, true);
                if (key == null) return false;

                key.SetValue("ProxyEnable", 1, RegistryValueKind.DWord);
                key.SetValue("ProxyServer", proxyServer, RegistryValueKind.String);
                key.SetValue("ProxyOverride", "<local>", RegistryValueKind.String);

                // Notify all active Windows processes and browsers of proxy changes
                InternetSetOption(IntPtr.Zero, INTERNET_OPTION_SETTINGS_CHANGED, IntPtr.Zero, 0);
                InternetSetOption(IntPtr.Zero, INTERNET_OPTION_REFRESH, IntPtr.Zero, 0);

                // Flush DNS cache
                try { DnsFlushResolverCache(); } catch { }
                RunCommandHidden("netsh", "winhttp set proxy 127.0.0.1:9050");
                return true;
            }
            catch (Exception ex)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine($"[!] Error configuring system proxy: {ex.Message}");
                Console.ResetColor();
                return false;
            }
        }

        public static bool DisableSystemTorProxy()
        {
            try
            {
                using var key = Registry.CurrentUser.OpenSubKey(RegistryKeyPath, true);
                if (key != null)
                {
                    key.SetValue("ProxyEnable", 0, RegistryValueKind.DWord);
                    key.DeleteValue("ProxyServer", false);
                }

                InternetSetOption(IntPtr.Zero, INTERNET_OPTION_SETTINGS_CHANGED, IntPtr.Zero, 0);
                InternetSetOption(IntPtr.Zero, INTERNET_OPTION_REFRESH, IntPtr.Zero, 0);

                try { DnsFlushResolverCache(); } catch { }
                RunCommandHidden("netsh", "winhttp reset proxy");
                return true;
            }
            catch (Exception ex)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine($"[!] Error restoring native proxy: {ex.Message}");
                Console.ResetColor();
                return false;
            }
        }

        private static void RunCommandHidden(string fileName, string args)
        {
            try
            {
                var psi = new ProcessStartInfo
                {
                    FileName = fileName,
                    Arguments = args,
                    CreateNoWindow = true,
                    UseShellExecute = false
                };
                using var p = Process.Start(psi);
                p?.WaitForExit(1000);
            }
            catch { }
        }
    }
}
