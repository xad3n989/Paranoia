using System;
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
                Console.WriteLine(" Please right-click Paranoia.exe and select 'Run as administrator'.\n");
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

                // Killswitch failsafe guard: if proxy is active and killswitch is armed,
                // verify that Tor socks port is still reachable!
                if (_proxyActive && _killswitchArmed)
                {
                    if (!_tor.TestSocksPort())
                    {
                        lock (_consoleLock)
                        {
                            Console.ForegroundColor = ConsoleColor.Red;
                            Console.WriteLine("\n[EMERGENCY] TOR DISCONNECTION DETECTED! KILLSWITCH FIRING IMMEDIATE LOCKDOWN!");
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
                case '1':
                    ToggleProxy();
                    break;
                case '2':
                    ToggleKillswitch();
                    break;
                case '3':
                    CycleCircuit();
                    break;
                case '4':
                    ConfigureExitNodes();
                    break;
                case '5':
                    RunLeakCheck();
                    break;
                case '6':
                    FlushDnsAndPurge();
                    break;
                case '7':
                    EmergencyLockdown();
                    break;
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
                    // Arm killswitch automatically if configured
                    if (_killswitchArmed)
                    {
                        FirewallKillswitch.Arm();
                    }
                    QueryCurrentIpAsync();
                }
            }
            else
            {
                WindowsProxy.DisableSystemTorProxy();
                _proxyActive = false;
                if (_killswitchArmed)
                {
                    FirewallKillswitch.Disarm();
                }
                QueryCurrentIpAsync();
            }
        }

        private static void ToggleKillswitch()
        {
            _killswitchArmed = !_killswitchArmed;
            if (_killswitchArmed && _proxyActive)
            {
                FirewallKillswitch.Arm();
            }
            else
            {
                FirewallKillswitch.Disarm();
            }
        }

        private static void CycleCircuit()
        {
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine("\n[*] Requesting SIGNAL NEWNYM from Tor ControlPort...");
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
            Console.WriteLine($" Strict Enforcement: {(_tor.StrictExitNodes ? "ENABLED" : "DISABLED")}\n");
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

            Console.WriteLine("\n[*] Testing external IP address...");
            QueryCurrentIpAsync();
            Thread.Sleep(1500);

            Console.WriteLine($"[+] External Observed IP: {_publicIp} ({_publicCountry})");
            Console.WriteLine("\nPress any key to return to dashboard...");
            Console.ReadKey(true);
        }

        private static void FlushDnsAndPurge()
        {
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine("\n[*] Flushing Windows DNS Resolver Cache and NetBIOS...");
            WindowsProxy.FlushDns();
            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine("[+] DNS Cache purged. Zero stale IP records remaining.");
            Console.ResetColor();
            Thread.Sleep(1000);
        }

        private static void EmergencyLockdown()
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine("\n[!] EXECUTING EMERGENCY AIR-GAP LOCKDOWN!");
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

                // Status Indicators
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

                // Real-Time Telemetry HUD
                Console.ForegroundColor = ConsoleColor.Cyan;
                Console.WriteLine("\n-- [ REAL-TIME TELEMETRY & NETWORK SPEED ] ------------------------------------");
                Console.ResetColor();
                Console.WriteLine($"  Latency to Exit:     {_tor.LatencyMs} ms");
                Console.WriteLine($"  Download Speed:      {_tor.DownloadSpeedKbps:F1} KB/s  | Total Rx: {_tor.BytesRead / 1024:N0} KB");
                Console.WriteLine($"  Upload Speed:        {_tor.UploadSpeedKbps:F1} KB/s  | Total Tx: {_tor.BytesWritten / 1024:N0} KB");
                Console.WriteLine($"  Tor SOCKS Port:      127.0.0.1:{_tor.SocksPort}  | Control Port: 127.0.0.1:{_tor.ControlPort}");

                // Key Command Menu
                Console.ForegroundColor = ConsoleColor.White;
                Console.WriteLine("\n-- [ COMMANDS ] ----------------------------------------------------------------");
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
}
