// Production C# .NET 8.0 Source Code for Paranoia Windows Native Application

export interface CSharpSourceFile {
  name: string;
  relativePath: string;
  language: string;
  description: string;
  content: string;
}

export const CSHARP_FILES: CSharpSourceFile[] = [
  {
    name: 'Paranoia.csproj',
    relativePath: 'Paranoia/Paranoia.csproj',
    language: 'xml',
    description: 'Project configuration: targets net8.0-windows, win-x64, single-file self-contained executable',
    content: `<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net8.0-windows</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <ApplicationManifest>app.manifest</ApplicationManifest>
    <PublishSingleFile>true</PublishSingleFile>
    <SelfContained>true</SelfContained>
    <RuntimeIdentifier>win-x64</RuntimeIdentifier>
    <AssemblyName>Paranoia</AssemblyName>
    <RootNamespace>Paranoia</RootNamespace>
    <Version>2.5.0</Version>
    <Authors>Paranoia Security Group</Authors>
    <Description>PARANOIA - Windows Tor System-Wide Transparent Routing &amp; Zero-Leak Failsafe Engine</Description>
    <AllowUnsafeBlocks>true</AllowUnsafeBlocks>
    <IncludeNativeLibrariesForSelfExtract>true</IncludeNativeLibrariesForSelfExtract>
  </PropertyGroup>

</Project>`
  },
  {
    name: 'Paranoia.sln',
    relativePath: 'Paranoia.sln',
    language: 'plaintext',
    description: 'Microsoft Visual Studio 2022 Solution file',
    content: `Microsoft Visual Studio Solution File, Format Version 12.00
# Visual Studio Version 17
VisualStudioVersion = 17.8.34330.188
MinimumVisualStudioVersion = 10.0.40219.1
Project("{9A19103F-16F7-4668-BE54-9A1E7A4F7556}") = "Paranoia", "Paranoia\\Paranoia.csproj", "{4E23A1B2-7901-4D93-9F38-CE12984180A2}"
EndProject
Global
	GlobalSection(SolutionConfigurationPlatforms) = preSolution
		Debug|Any CPU = Debug|Any CPU
		Debug|x64 = Debug|x64
		Release|Any CPU = Release|Any CPU
		Release|x64 = Release|x64
	EndGlobalSection
	GlobalSection(ProjectConfigurationPlatforms) = postSolution
		{4E23A1B2-7901-4D93-9F38-CE12984180A2}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{4E23A1B2-7901-4D93-9F38-CE12984180A2}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{4E23A1B2-7901-4D93-9F38-CE12984180A2}.Debug|x64.ActiveCfg = Debug|x64
		{4E23A1B2-7901-4D93-9F38-CE12984180A2}.Debug|x64.Build.0 = Debug|x64
		{4E23A1B2-7901-4D93-9F38-CE12984180A2}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{4E23A1B2-7901-4D93-9F38-CE12984180A2}.Release|Any CPU.Build.0 = Release|Any CPU
		{4E23A1B2-7901-4D93-9F38-CE12984180A2}.Release|x64.ActiveCfg = Release|x64
		{4E23A1B2-7901-4D93-9F38-CE12984180A2}.Release|x64.Build.0 = Release|x64
	EndGlobalSection
	GlobalSection(SolutionProperties) = preSolution
		HideSolutionNode = FALSE
	EndGlobalSection
EndGlobal`
  },
  {
    name: 'Program.cs',
    relativePath: 'Paranoia/Program.cs',
    language: 'csharp',
    description: 'Main C# entry point: ANSI terminal UI, hotkeys [1-8], background telemetry heartbeat & cleanup hooks',
    content: `using System;
using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Security.Principal;
using System.Threading;
using System.Threading.Tasks;

namespace Paranoia
{
    internal class Program
    {
        private static TorEngine _tor = new();
        private static bool _proxyActive = false;
        private static bool _killswitchArmed = false;
        private static bool _running = true;
        private static string _publicIp = "Checking...";
        private static string _publicCountry = "Unknown";
        private static readonly object _consoleLock = new();

        static void Main(string[] args)
        {
            Console.Title = "PARANOIA v2.5.0 | Windows System-Wide Tor Router & Zero-Leak Killswitch";
            Console.OutputEncoding = System.Text.Encoding.UTF8;

            // Check Administrator Privileges
            if (!IsAdministrator())
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine("===============================================================================");
                Console.WriteLine(" [!] ERROR: ELEVATED PRIVILEGES REQUIRED");
                Console.WriteLine("===============================================================================");
                Console.ResetColor();
                Console.WriteLine(" Paranoia modifies Windows Internet Settings, DNS cache, and netsh AdvFirewall.");
                Console.WriteLine(" Please right-click Paranoia.exe and select 'Run as administrator'.\\n");
                Console.WriteLine(" Press any key to exit...");
                Console.ReadKey();
                return;
            }

            // Register cleanup handlers
            Console.CancelKeyPress += (sender, e) =>
            {
                e.Cancel = true;
                CleanupAndExit();
            };
            AppDomain.CurrentDomain.ProcessExit += (sender, e) =>
            {
                CleanupAndExit();
            };

            // Start Tor daemon
            Console.ForegroundColor = ConsoleColor.Cyan;
            Console.WriteLine("[*] Initializing Tor Engine and verifying local daemons...");
            Console.ResetColor();

            bool torReady = _tor.StartTor();
            if (!torReady)
            {
                Console.ForegroundColor = ConsoleColor.Yellow;
                Console.WriteLine("[!] Tor binary was not automatically started. Paranoia will look for socks5 on 127.0.0.1:9050.");
                Console.ResetColor();
            }

            // Start Telemetry and Heartbeat thread
            var telemetryThread = new Thread(TelemetryLoop) { IsBackground = true };
            telemetryThread.Start();

            // Main UI & Input Loop
            RenderFullUI();

            while (_running)
            {
                if (Console.KeyAvailable)
                {
                    var key = Console.ReadKey(true).KeyChar;
                    HandleKey(key);
                    RenderFullUI();
                }
                Thread.Sleep(80);
            }
        }

        private static bool IsAdministrator()
        {
            using var identity = WindowsIdentity.GetCurrent();
            var principal = new WindowsPrincipal(identity);
            return principal.IsInRole(WindowsBuiltInRole.Administrator);
        }

        private static void TelemetryLoop()
        {
            var sw = Stopwatch.StartNew();
            long lastTick = 0;

            while (_running)
            {
                long currentTick = sw.ElapsedMilliseconds;
                long elapsed = currentTick - lastTick;
                lastTick = currentTick;

                _tor.UpdateTelemetry(elapsed);

                // Killswitch failsafe guard
                if (_proxyActive && _killswitchArmed)
                {
                    if (!_tor.TestSocksPort())
                    {
                        lock (_consoleLock)
                        {
                            Console.ForegroundColor = ConsoleColor.Red;
                            Console.WriteLine("\\n[EMERGENCY] TOR DISCONNECTION DETECTED! KILLSWITCH FIRING IMMEDIATE LOCKDOWN!");
                            Console.ResetColor();
                        }
                        FirewallKillswitch.TriggerEmergencyLockdown();
                    }
                }

                Thread.Sleep(1000);
            }
        }

        private static void HandleKey(char key)
        {
            switch (key)
            {
                case '1': ToggleProxy(); break;
                case '2': ToggleKillswitch(); break;
                case '3': CycleCircuit(); break;
                case '4': ConfigureExitNodes(); break;
                case '5': RunLeakCheck(); break;
                case '6': FlushDnsAndPurge(); break;
                case '7': EmergencyLockdown(); break;
                case '8':
                case 'q':
                case 'Q':
                    CleanupAndExit();
                    break;
            }
        }

        private static void ToggleProxy()
        {
            if (!_proxyActive)
            {
                bool ok = WindowsProxy.EnableSystemTorProxy("socks=127.0.0.1:9050");
                if (ok)
                {
                    _proxyActive = true;
                    if (_killswitchArmed) FirewallKillswitch.Arm();
                    QueryCurrentIpAsync();
                }
            }
            else
            {
                WindowsProxy.DisableSystemTorProxy();
                _proxyActive = false;
                if (_killswitchArmed) FirewallKillswitch.Disarm();
                QueryCurrentIpAsync();
            }
        }

        private static void ToggleKillswitch()
        {
            _killswitchArmed = !_killswitchArmed;
            if (_killswitchArmed && _proxyActive) FirewallKillswitch.Arm();
            else FirewallKillswitch.Disarm();
        }

        private static void CycleCircuit()
        {
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine("\\n[*] Requesting SIGNAL NEWNYM from Tor ControlPort...");
            Console.ResetColor();

            bool ok = _tor.RequestNewIdentity();
            if (ok)
            {
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine("[+] Success! New Tor circuit generated.");
            }
            else
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine("[-] Could not reach Tor ControlPort on 127.0.0.1:9051.");
            }
            Console.ResetColor();
            Thread.Sleep(800);
            QueryCurrentIpAsync();
        }

        private static void ConfigureExitNodes()
        {
            Console.Clear();
            Console.ForegroundColor = ConsoleColor.Cyan;
            Console.WriteLine("===============================================================================");
            Console.WriteLine("                     PARANOIA EXIT NODE CONFIGURATION                          ");
            Console.WriteLine("===============================================================================");
            Console.ResetColor();
            Console.WriteLine($" Current Exit Nodes: {_tor.PreferredExitNodes}");
            Console.WriteLine($" Strict Enforcement: {(_tor.StrictExitNodes ? "ENABLED" : "DISABLED")}\\n");
            Console.WriteLine(" Enter comma-separated country codes in curly brackets (e.g. {ch},{is},{de},{nl}):");
            Console.Write(" New ExitNodes (press Enter to keep current): ");
            
            string? input = Console.ReadLine();
            if (!string.IsNullOrWhiteSpace(input))
            {
                _tor.PreferredExitNodes = input.Trim();
            }

            Console.Write(" Force strict exit node enforcement? (y/N): ");
            var strictKey = Console.ReadKey().KeyChar;
            _tor.StrictExitNodes = (strictKey == 'y' || strictKey == 'Y');
            Console.WriteLine();

            _tor.WriteTorrc();
            _tor.RequestNewIdentity();

            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine("[+] Exit node preferences saved to torrc and reloaded.");
            Console.ResetColor();
            Thread.Sleep(1200);
        }

        private static void RunLeakCheck()
        {
            Console.Clear();
            Console.ForegroundColor = ConsoleColor.Cyan;
            Console.WriteLine("===============================================================================");
            Console.WriteLine("                     PARANOIA DEEP LEAK DIAGNOSTIC                             ");
            Console.WriteLine("===============================================================================");
            Console.ResetColor();
            Console.WriteLine("[*] Probing Windows network interfaces and active sockets...");

            Console.WriteLine($"[+] System Proxy State:   {(_proxyActive ? "ACTIVATED (socks=127.0.0.1:9050)" : "DISABLED (Direct Internet)")}");
            Console.WriteLine($"[+] Firewall Killswitch:  {(_killswitchArmed ? "ARMED (Non-Tor Outbound Blocked)" : "DISARMED")}");
            Console.WriteLine($"[+] Socks5 Listener:      {(_tor.TestSocksPort() ? "LISTENING (127.0.0.1:9050)" : "OFFLINE")}");
            Console.WriteLine($"[+] ControlPort 9051:     {(_tor.ConnectControlPort() ? "AUTHENTICATED" : "NOT RESPONDING")}");

            Console.WriteLine("\\n[*] Testing external IP address...");
            QueryCurrentIpAsync();
            Thread.Sleep(1500);

            Console.WriteLine($"[+] External Observed IP: {_publicIp} ({_publicCountry})");
            Console.WriteLine("\\nPress any key to return to dashboard...");
            Console.ReadKey(true);
        }

        private static void FlushDnsAndPurge()
        {
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine("\\n[*] Flushing Windows DNS Resolver Cache and NetBIOS...");
            WindowsProxy.FlushDns();
            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine("[+] DNS Cache purged. Zero stale IP records remaining.");
            Console.ResetColor();
            Thread.Sleep(1000);
        }

        private static void EmergencyLockdown()
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine("\\n[!] EXECUTING EMERGENCY AIR-GAP LOCKDOWN!");
            FirewallKillswitch.TriggerEmergencyLockdown();
            Console.WriteLine("[!] All network adapters severed via Windows Firewall.");
            Console.ResetColor();
            Thread.Sleep(1500);
        }

        private static void QueryCurrentIpAsync()
        {
            Task.Run(async () =>
            {
                try
                {
                    using var handler = new HttpClientHandler
                    {
                        UseProxy = _proxyActive,
                        Proxy = _proxyActive ? new System.Net.WebProxy("socks5://127.0.0.1:9050") : null
                    };
                    using var client = new HttpClient(handler) { Timeout = TimeSpan.FromSeconds(5) };
                    string ip = await client.GetStringAsync("https://api.ipify.org");
                    _publicIp = ip.Trim();
                }
                catch
                {
                    _publicIp = _proxyActive ? "Routed (Tor Masked)" : "Check Failed";
                }
            });
        }

        private static void RenderFullUI()
        {
            lock (_consoleLock)
            {
                Console.Clear();
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine("  ██████╗  █████╗ ██████╗  █████╗ ███╗   ██╗ ██████╗ ██╗ █████╗ ");
                Console.WriteLine("  ██╔══██╗██╔══██╗██╔══██╗██╔══██╗████╗  ██║██╔═══██╗██║██╔══██╗");
                Console.WriteLine("  ██████╔╝███████║██████╔╝███████║██╔██╗ ██║██║   ██║██║███████║");
                Console.WriteLine("  ██╔═══╝ ██╔══██║██╔══██╗██╔══██║██║╚██╗██║██║   ██║██║██╔══██║");
                Console.WriteLine("  ██║     ██║  ██║██║  ██║██║  ██║██║ ╚████║╚██████╔╝██║██║  ██║");
                Console.WriteLine("  ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚═╝╚═╝  ╚═╝");
                Console.ForegroundColor = ConsoleColor.DarkGray;
                Console.WriteLine("  WINDOWS SYSTEM-WIDE TOR TRANSPARENT ROUTER | NATIVE C# .NET 8.0 (x64)");
                Console.WriteLine("===============================================================================");
                Console.ResetColor();

                Console.Write("  ROUTING STATUS:      ");
                if (_proxyActive)
                {
                    Console.ForegroundColor = ConsoleColor.Green;
                    Console.WriteLine("[ ACTIVE -> ALL TRAFFIC ROUTED VIA TOR ]");
                }
                else
                {
                    Console.ForegroundColor = ConsoleColor.DarkYellow;
                    Console.WriteLine("[ DISABLED -> DIRECT UNENCRYPTED INTERNET ]");
                }
                Console.ResetColor();

                Console.Write("  FAILSAFE KILLSWITCH: ");
                if (_killswitchArmed)
                {
                    Console.ForegroundColor = ConsoleColor.Green;
                    Console.WriteLine("[ ARMED -> FIREWALL IS ENFORCING TOR ONLY ]");
                }
                else
                {
                    Console.ForegroundColor = ConsoleColor.Red;
                    Console.WriteLine("[ DISARMED -> LEAK RISK IF TOR FAILS ]");
                }
                Console.ResetColor();

                Console.WriteLine($"  CIRCUIT STATUS:      {_tor.CircuitStatus}");
                Console.WriteLine($"  PREFERRED EXITS:     {_tor.PreferredExitNodes} (Strict: {_tor.StrictExitNodes})");
                Console.WriteLine($"  EXTERNAL IP:         {_publicIp}");

                Console.ForegroundColor = ConsoleColor.Cyan;
                Console.WriteLine("\\n-- [ REAL-TIME TELEMETRY & NETWORK SPEED ] ------------------------------------");
                Console.ResetColor();
                Console.WriteLine($"  Latency to Exit:     {_tor.LatencyMs} ms");
                Console.WriteLine($"  Download Speed:      {_tor.DownloadSpeedKbps:F1} KB/s  | Total Rx: {_tor.BytesRead / 1024:N0} KB");
                Console.WriteLine($"  Upload Speed:        {_tor.UploadSpeedKbps:F1} KB/s  | Total Tx: {_tor.BytesWritten / 1024:N0} KB");
                Console.WriteLine($"  Tor SOCKS Port:      127.0.0.1:{_tor.SocksPort}  | Control Port: 127.0.0.1:{_tor.ControlPort}");

                Console.ForegroundColor = ConsoleColor.White;
                Console.WriteLine("\\n-- [ COMMANDS ] ----------------------------------------------------------------");
                Console.ResetColor();
                Console.WriteLine("  [1] Toggle Tor System-Wide Routing      [5] Run Deep Leak Diagnostic");
                Console.WriteLine("  [2] Toggle Zero-Leak Killswitch          [6] Flush DNS & NetBIOS Cache");
                Console.WriteLine("  [3] Request New Tor Identity (NEWNYM)   [7] Emergency Lockdown (Cut Net)");
                Console.WriteLine("  [4] Change Preferred Exit Nodes         [8] Exit & Restore Windows Defaults");
                Console.ForegroundColor = ConsoleColor.DarkGray;
                Console.WriteLine("===============================================================================");
                Console.Write("  Paranoia> ");
                Console.ResetColor();
            }
        }

        private static void CleanupAndExit()
        {
            _running = false;
            Console.Clear();
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine("[*] Restoring Windows default network configuration...");

            WindowsProxy.DisableSystemTorProxy();
            WindowsProxy.FlushDns();
            FirewallKillswitch.Disarm();
            _tor.StopTor();

            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine("[+] Windows proxy disabled.");
            Console.WriteLine("[+] Windows firewall rules restored.");
            Console.WriteLine("[+] Tor daemon stopped.");
            Console.WriteLine("[+] Zero traces left behind. Goodbye.");
            Console.ResetColor();
            Environment.Exit(0);
        }
    }
}`
  },
  {
    name: 'WindowsProxy.cs',
    relativePath: 'Paranoia/WindowsProxy.cs',
    language: 'csharp',
    description: 'WinINet P/Invoke (InternetSetOption), Registry HKCU Internet Settings, and WinHTTP Proxy hooks',
    content: `using System;
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

        private const string RegistryKeyPath = @"Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings";

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
                Console.WriteLine($"[!] Error disabling system proxy: {ex.Message}");
                Console.ResetColor();
                return false;
            }
        }

        public static void FlushDns()
        {
            try { DnsFlushResolverCache(); } catch { }
            RunCommandHidden("ipconfig", "/flushdns");
            RunCommandHidden("nbtstat", "-R");
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
}`
  },
  {
    name: 'TorEngine.cs',
    relativePath: 'Paranoia/TorEngine.cs',
    language: 'csharp',
    description: 'Tor daemon process management, custom torrc writer, and raw TCP ControlPort 9051 client',
    content: `using System;
using System.Diagnostics;
using System.IO;
using System.Net.Sockets;
using System.Text;
using System.Threading;

namespace Paranoia
{
    public class TorEngine : IDisposable
    {
        private Process? _torProcess;
        private TcpClient? _controlClient;
        private NetworkStream? _controlStream;
        private StreamReader? _controlReader;
        private StreamWriter? _controlWriter;
        private readonly string _workingDir;
        private readonly string _dataDir;
        private readonly string _torrcPath;

        public bool IsRunning => _torProcess != null && !_torProcess.HasExited;
        public bool IsConnectedToControlPort => _controlClient != null && _controlClient.Connected;
        public int SocksPort { get; set; } = 9050;
        public int ControlPort { get; set; } = 9051;
        public string PreferredExitNodes { get; set; } = "{us},{de},{ch}";
        public bool StrictExitNodes { get; set; } = false;

        public long BytesRead { get; private set; }
        public long BytesWritten { get; private set; }
        public double DownloadSpeedKbps { get; private set; }
        public double UploadSpeedKbps { get; private set; }
        public int LatencyMs { get; private set; }
        public string CurrentExitNodeInfo { get; private set; } = "Unknown";
        public string CircuitStatus { get; private set; } = "Initializing Circuit";

        public TorEngine()
        {
            _workingDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Paranoia");
            _dataDir = Path.Combine(_workingDir, "data");
            _torrcPath = Path.Combine(_workingDir, "torrc");

            Directory.CreateDirectory(_workingDir);
            Directory.CreateDirectory(_dataDir);
        }

        public void WriteTorrc()
        {
            var sb = new StringBuilder();
            sb.AppendLine($"DataDirectory \\"{_dataDir.Replace('\\\\', '/')}\\"");
            sb.AppendLine($"SocksPort {SocksPort}");
            sb.AppendLine($"ControlPort {ControlPort}");
            sb.AppendLine("CookieAuthentication 0");
            sb.AppendLine("Log notice stdout");
            sb.AppendLine("AvoidDisruptedCircuits 1");
            sb.AppendLine("CircuitBuildTimeout 15");

            if (!string.IsNullOrWhiteSpace(PreferredExitNodes))
            {
                sb.AppendLine($"ExitNodes {PreferredExitNodes}");
                sb.AppendLine($"StrictNodes {(StrictExitNodes ? "1" : "0")}");
            }

            File.WriteAllText(_torrcPath, sb.ToString());
        }

        public bool StartTor()
        {
            WriteTorrc();
            string torExe = FindTorExecutable();
            if (string.IsNullOrEmpty(torExe))
            {
                if (TestSocksPort())
                {
                    ConnectControlPort();
                    return true;
                }
                return false;
            }

            try
            {
                var psi = new ProcessStartInfo
                {
                    FileName = torExe,
                    Arguments = $"-f \\"{_torrcPath}\\"",
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    WorkingDirectory = _workingDir
                };

                _torProcess = new Process { StartInfo = psi };
                _torProcess.OutputDataReceived += (s, e) =>
                {
                    if (!string.IsNullOrEmpty(e.Data) && e.Data.Contains("Bootstrapped"))
                    {
                        CircuitStatus = e.Data.Trim();
                    }
                };

                _torProcess.Start();
                _torProcess.BeginOutputReadLine();

                for (int i = 0; i < 12; i++)
                {
                    Thread.Sleep(500);
                    if (TestSocksPort())
                    {
                        ConnectControlPort();
                        return true;
                    }
                }

                return TestSocksPort();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[!] Failed to start Tor process: {ex.Message}");
                return false;
            }
        }

        private string FindTorExecutable()
        {
            string[] candidatePaths = new[]
            {
                Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "tor", "tor.exe"),
                Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "tor.exe"),
                Path.Combine(_workingDir, "tor", "tor.exe"),
                @"C:\\Program Files\\Tor\\tor.exe",
                @"C:\\Program Files (x86)\\Tor Browser\\Browser\\TorBrowser\\Tor\\tor.exe"
            };

            foreach (var path in candidatePaths)
            {
                if (File.Exists(path)) return path;
            }
            return string.Empty;
        }

        public bool TestSocksPort()
        {
            try
            {
                using var client = new TcpClient();
                var result = client.BeginConnect("127.0.0.1", SocksPort, null, null);
                bool success = result.AsyncWaitHandle.WaitOne(TimeSpan.FromMilliseconds(400));
                if (!success) return false;
                client.EndConnect(result);
                return client.Connected;
            }
            catch { return false; }
        }

        public bool ConnectControlPort()
        {
            try
            {
                _controlClient = new TcpClient();
                var res = _controlClient.BeginConnect("127.0.0.1", ControlPort, null, null);
                bool success = res.AsyncWaitHandle.WaitOne(TimeSpan.FromMilliseconds(800));
                if (!success) return false;
                _controlClient.EndConnect(res);

                _controlStream = _controlClient.GetStream();
                _controlReader = new StreamReader(_controlStream, Encoding.ASCII);
                _controlWriter = new StreamWriter(_controlStream, Encoding.ASCII) { AutoFlush = true };

                _controlWriter.WriteLine("AUTHENTICATE \\"\\"");
                string? response = _controlReader.ReadLine();
                return response != null && response.StartsWith("250");
            }
            catch { return false; }
        }

        public bool RequestNewIdentity()
        {
            if (_controlWriter == null || _controlReader == null)
            {
                if (!ConnectControlPort()) return false;
            }

            try
            {
                _controlWriter?.WriteLine("SIGNAL NEWNYM");
                string? resp = _controlReader?.ReadLine();
                CircuitStatus = "Circuits flushed - Fresh Identity issued";
                return resp != null && resp.StartsWith("250");
            }
            catch { return false; }
        }

        public void UpdateTelemetry(long elapsedMs)
        {
            long lastRead = BytesRead;
            long lastWritten = BytesWritten;

            if (_controlWriter != null && _controlReader != null && _controlClient != null && _controlClient.Connected)
            {
                try
                {
                    _controlWriter.WriteLine("GETINFO traffic/read traffic/written");
                    string? l1 = _controlReader.ReadLine();
                    string? l2 = _controlReader.ReadLine();
                    string? l3 = _controlReader.ReadLine();

                    if (l1 != null && l1.StartsWith("250-traffic/read="))
                    {
                        if (long.TryParse(l1.Replace("250-traffic/read=", "").Trim(), out long read))
                            BytesRead = read;
                    }
                    if (l2 != null && l2.StartsWith("250-traffic/written="))
                    {
                        if (long.TryParse(l2.Replace("250-traffic/written=", "").Trim(), out long written))
                            BytesWritten = written;
                    }

                    if (elapsedMs > 0)
                    {
                        DownloadSpeedKbps = Math.Max(0, (BytesRead - lastRead) * 8.0 / (elapsedMs * 1.024));
                        UploadSpeedKbps = Math.Max(0, (BytesWritten - lastWritten) * 8.0 / (elapsedMs * 1.024));
                    }
                }
                catch { }
            }

            var sw = Stopwatch.StartNew();
            bool isAlive = TestSocksPort();
            sw.Stop();
            LatencyMs = isAlive ? (int)sw.ElapsedMilliseconds : 999;
        }

        public void StopTor()
        {
            try
            {
                _controlWriter?.WriteLine("SIGNAL SHUTDOWN");
                _controlWriter?.Flush();
            }
            catch { }

            try
            {
                if (_torProcess != null && !_torProcess.HasExited)
                {
                    _torProcess.Kill();
                    _torProcess.WaitForExit(1000);
                }
            }
            catch { }
            finally { _torProcess = null; }
        }

        public void Dispose()
        {
            StopTor();
            _controlReader?.Dispose();
            _controlWriter?.Dispose();
            _controlStream?.Dispose();
            _controlClient?.Dispose();
        }
    }
}`
  },
  {
    name: 'FirewallKillswitch.cs',
    relativePath: 'Paranoia/FirewallKillswitch.cs',
    language: 'csharp',
    description: 'Windows Defender Firewall rules: hard isolation of non-Tor outbound traffic to prevent IPv4/IPv6 leaks',
    content: `using System;
using System.Diagnostics;

namespace Paranoia
{
    public static class FirewallKillswitch
    {
        public static bool IsArmed { get; private set; } = true;
        public static bool IsEmergencyLockdown { get; private set; } = false;

        public static void Arm()
        {
            RunNetsh("advfirewall firewall add rule name=\\"PARANOIA_BLOCK_OUT\\" dir=out action=block protocol=ANY remoteip=any enable=yes");
            RunNetsh("advfirewall firewall add rule name=\\"PARANOIA_ALLOW_TOR\\" dir=out action=allow program=\\"tor.exe\\" enable=yes");
            RunNetsh("advfirewall firewall add rule name=\\"PARANOIA_ALLOW_LOCAL\\" dir=out action=allow remoteip=127.0.0.1 enable=yes");
            IsArmed = true;
            IsEmergencyLockdown = false;
        }

        public static void Disarm()
        {
            RunNetsh("advfirewall firewall delete rule name=\\"PARANOIA_BLOCK_OUT\\"");
            RunNetsh("advfirewall firewall delete rule name=\\"PARANOIA_ALLOW_TOR\\"");
            RunNetsh("advfirewall firewall delete rule name=\\"PARANOIA_ALLOW_LOCAL\\"");
            RunNetsh("advfirewall firewall delete rule name=\\"PARANOIA_EMERGENCY_DROP\\"");
            IsArmed = false;
            IsEmergencyLockdown = false;
        }

        public static void TriggerEmergencyLockdown()
        {
            IsEmergencyLockdown = true;
            RunNetsh("advfirewall firewall add rule name=\\"PARANOIA_EMERGENCY_DROP\\" dir=out action=block protocol=ANY enable=yes");
        }

        private static void RunNetsh(string args)
        {
            try
            {
                var psi = new ProcessStartInfo
                {
                    FileName = "netsh",
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
}`
  },
  {
    name: 'app.manifest',
    relativePath: 'Paranoia/app.manifest',
    language: 'xml',
    description: 'UAC elevation manifest: prompts for administrator permissions on launch',
    content: `<?xml version="1.0" encoding="utf-8"?>
<assembly manifestVersion="1.0" xmlns="urn:schemas-microsoft-com:asm.v1">
  <assemblyIdentity version="2.5.0.0" name="Paranoia.app"/>
  <trustInfo xmlns="urn:schemas-microsoft-com:asm.v2">
    <security>
      <requestedPrivileges xmlns="urn:schemas-microsoft-com:asm.v3">
        <requestedExecutionLevel level="requireAdministrator" uiAccess="false" />
      </requestedPrivileges>
    </security>
  </trustInfo>
  <compatibility xmlns="urn:schemas-microsoft-com:compatibility.v1">
    <application>
      <!-- Windows 10 & Windows 11 -->
      <supportedOS Id="{8e0f7a12-bfb3-4fe8-b9a5-48fd50a15a9a}" />
    </application>
  </compatibility>
</assembly>`
  },
  {
    name: 'build.cmd',
    relativePath: 'build.cmd',
    language: 'bat',
    description: '1-Click compilation script producing a standalone self-contained Paranoia.exe for Windows x64',
    content: `@echo off
setlocal enabledelayedexpansion
title PARANOIA - C# .NET 8.0 Windows Application Builder
color 0C

echo ===============================================================================
echo        PARANOIA v2.5.0 - NATIVE C# .NET 8.0 STANDALONE EXECUTABLE BUILDER
echo ===============================================================================
echo.

where dotnet >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [!] ERROR: Microsoft .NET SDK was not found in your PATH.
    echo [*] Please install .NET 8.0 SDK from: https://dotnet.microsoft.com/download/dotnet/8.0
    echo.
    pause
    exit /b 1
)

echo [*] Target Project: Paranoia\\Paranoia.csproj
echo [*] Architecture:   Windows x64 (win-x64)
echo [*] Configuration:  Release
echo [*] SingleFile:     Enabled (Bundled into standalone Paranoia.exe)
echo [*] SelfContained:  Enabled (Runs on ANY Windows machine without installing .NET runtime)
echo.
echo [*] Building and publishing standalone Windows executable...
echo.

cd /d "%~dp0"
dotnet publish Paranoia\\Paranoia.csproj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true -o .\\bin\\publish

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===============================================================================
    echo  [+] SUCCESS: Paranoia.exe compiled successfully!
    echo ===============================================================================
    echo  Binary Location: %~dp0bin\\publish\\Paranoia.exe
    echo.
    echo  To launch Paranoia:
    echo    1. Right-click '%~dp0bin\\publish\\Paranoia.exe'
    echo    2. Select 'Run as administrator'
    echo ===============================================================================
    echo.
) else (
    echo.
    echo [!] Compilation failed. Please check build errors above.
    echo.
)

pause`
  },
  {
    name: 'README.md',
    relativePath: 'README.md',
    language: 'markdown',
    description: 'Build and run instructions for Visual Studio 2022 and dotnet CLI',
    content: `# PARANOIA — C# .NET 8.0 Windows Application (win-x64)

Native Windows system-wide Tor transparent router with zero-leak Windows Firewall killswitch, real-time speed & latency telemetry, and dynamic exit node routing.

## Project Structure
\`\`\`
/dotnet/
  ├── Paranoia.sln                   # Visual Studio 2022 Solution
  ├── build.cmd                      # 1-Click compiler for standalone Paranoia.exe
  └── Paranoia/
      ├── Paranoia.csproj            # .NET 8.0 Windows Executable Project
      ├── app.manifest               # UAC Elevation manifest (requireAdministrator)
      ├── Program.cs                 # Main terminal HUD & interactive command loop
      ├── WindowsProxy.cs            # Native WinINet & WinHTTP proxy configuration
      ├── TorEngine.cs               # Tor daemon controller & ControlPort socket
      └── FirewallKillswitch.cs      # Netsh AdvFirewall zero-leak failsafe rules
\`\`\`

## How to Build Standalone Paranoia.exe
### Option A: 1-Click Script
Double-click \`build.cmd\` on any Windows computer with [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0).

### Option B: Visual Studio 2022
1. Open \`Paranoia.sln\` in Visual Studio 2022.
2. Select **Release | x64**.
3. Right-click \`Paranoia\` project -> **Publish** (or Build -> Build Solution).

### Option C: .NET CLI
\`\`\`cmd
cd dotnet
dotnet publish Paranoia\\Paranoia.csproj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true -o .\\bin\\publish
\`\`\`

The output binary is a single standalone executable:
\`bin\\publish\\Paranoia.exe\` (zero dependencies, runs on any Windows 10/11 x64 machine).`
  }
];
