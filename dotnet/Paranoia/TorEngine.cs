using System;
using System.Diagnostics;
using System.IO;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

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

        // Telemetry
        public long BytesRead { get; private set; }
        public long BytesWritten { get; private set; }
        public double DownloadSpeedKbps { get; private set; }
        public double UploadSpeedKbps { get; private set; }
        public int LatencyMs { get; private set; }
        public string CurrentExitNodeInfo { get; private set; } = "Unknown / Initializing...";
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
            sb.AppendLine($"DataDirectory \"{_dataDir.Replace('\\', '/')}\"");
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

            // Locate tor.exe
            string torExe = FindTorExecutable();
            if (string.IsNullOrEmpty(torExe))
            {
                Console.ForegroundColor = ConsoleColor.Yellow;
                Console.WriteLine("[!] Warning: tor.exe not found in local path. Checking for existing Tor daemon on 127.0.0.1:9050...");
                Console.ResetColor();

                // If already running, test connection
                if (TestSocksPort())
                {
                    Console.ForegroundColor = ConsoleColor.Green;
                    Console.WriteLine("[+] Existing Tor instance detected and active on 127.0.0.1:9050.");
                    Console.ResetColor();
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
                    Arguments = $"-f \"{_torrcPath}\"",
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

                // Give Tor up to 6 seconds to bind
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
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine($"[!] Failed to start Tor process: {ex.Message}");
                Console.ResetColor();
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
                @"C:\Program Files\Tor\tor.exe",
                @"C:\Program Files (x86)\Tor Browser\Browser\TorBrowser\Tor\tor.exe"
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
            catch
            {
                return false;
            }
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

                // Authenticate
                _controlWriter.WriteLine("AUTHENTICATE \"\"");
                string? response = _controlReader.ReadLine();
                return response != null && response.StartsWith("250");
            }
            catch
            {
                return false;
            }
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
            catch
            {
                return false;
            }
        }

        public void UpdateTelemetry(long elapsedMs)
        {
            long lastRead = BytesRead;
            long lastWritten = BytesWritten;

            // Query Tor ControlPort traffic if open
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
                catch
                {
                    // Fall back to synthetic heartbeat
                }
            }

            // Measure socks roundtrip latency
            var sw = Stopwatch.StartNew();
            bool isAlive = TestSocksPort();
            sw.Stop();
            LatencyMs = isAlive ? (int)sw.ElapsedMilliseconds : 999;
        }

        public void StopTor()
        {
            try
            {
                if (_controlWriter != null)
                {
                    _controlWriter.WriteLine("SIGNAL SHUTDOWN");
                    _controlWriter.Flush();
                }
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
            finally
            {
                _torProcess = null;
            }
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
}
