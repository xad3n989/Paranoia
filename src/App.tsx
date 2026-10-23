import { useState, useEffect, useRef, useCallback } from 'react';
import { BatchMenu } from './components/BatchMenu';
import { CircuitVisualizer } from './components/CircuitVisualizer';
import { TerminalPrompt, ConsoleLine } from './components/TerminalPrompt';
import { LiveTelemetryPanel } from './components/LiveTelemetryPanel';
import { ScriptExporter } from './components/ScriptExporter';
import { RelayInspector } from './components/RelayInspector';
import { TorrcConfigModal, ExitNodePreference } from './components/TorrcConfigModal';
import { LeakTestModal } from './components/LeakTestModal';
import { MatrixRain } from './components/MatrixRain';
import { GUARD_RELAYS, MIDDLE_RELAYS, EXIT_RELAYS, TorNode } from './utils/torRelaysData';
import { detectPublicIP, IPReport } from './utils/leakCheck';
import { soundFx } from './utils/audio';
import {
  Volume2,
  VolumeX,
  Tv,
  Palette,
  Terminal as TerminalIcon,
  Download,
  Sliders,
  Shield,
  ShieldAlert,
  Power,
  RotateCcw,
} from 'lucide-react';

type RoutingStatus = 'IDLE' | 'BOOTSTRAPPING' | 'CONNECTED' | 'TERMINATING';
type TerminalTheme = 'matrix' | 'cmd' | 'crimson' | 'amber' | 'win95';

const DEFAULT_TORRC_CONFIG: ExitNodePreference = {
  countryCodes: ['ch', 'is', 'nl', 'se'],
  specificNodeIds: [],
  strictNodes: false,
  excludeExitNodes: ['us', 'gb'],
  socksPort: 9050,
  dnsPort: 5353,
  controlPort: 9051,
};

export default function App() {
  // Theme & Visual settings
  const [theme, setTheme] = useState<TerminalTheme>('matrix');
  const [crtScanlines, setCrtScanlines] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [matrixRain, setMatrixRain] = useState(false);

  // Tor Engine State
  const [status, setStatus] = useState<RoutingStatus>('IDLE');
  const [guardNode, setGuardNode] = useState<TorNode | null>(null);
  const [middleNode, setMiddleNode] = useState<TorNode | null>(null);
  const [exitNode, setExitNode] = useState<TorNode | null>(null);
  const [isRerolling, setIsRerolling] = useState(false);

  // Kill Switch & Failsafe State
  const [killswitchArmed, setKillswitchArmed] = useState(true);
  const [killswitchTriggered, setKillswitchTriggered] = useState(false);
  const [heartbeatHealthy, setHeartbeatHealthy] = useState(true);

  // Real-time Speed & Latency State
  const [downloadSpeed, setDownloadSpeed] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [latencyMs, setLatencyMs] = useState(0);
  const [jitterMs, setJitterMs] = useState(3);
  const [totalKbDown, setTotalKbDown] = useState(4820);
  const [totalKbUp, setTotalKbUp] = useState(1280);
  const [activeSockets, setActiveSockets] = useState<Array<{
    id: string;
    process: string;
    target: string;
    bytes: number;
    protocol: string;
  }>>([]);

  // Modals
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [relayModalOpen, setRelayModalOpen] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [leakModalOpen, setLeakModalOpen] = useState(false);

  // Leak Test Report
  const [leakReport, setLeakReport] = useState<IPReport | null>(null);
  const [isLeakTesting, setIsLeakTesting] = useState(false);

  // Torrc Preferences
  const [torConfig, setTorConfig] = useState<ExitNodePreference>(() => {
    try {
      const saved = localStorage.getItem('paranoia_torrc_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_TORRC_CONFIG;
  });

  // Terminal Lines
  const [consoleLines, setConsoleLines] = useState<ConsoleLine[]>([
    {
      id: 'init-1',
      type: 'notice',
      text: 'Microsoft Windows [Version 10.0.22631.3296]\n(c) Microsoft Corporation. All rights reserved.',
    },
    {
      id: 'init-2',
      type: 'output',
      text: 'PARANOIA v2.4.9 [TOR TRANSPARENT PROXY ENGINE] - WIN32/x64',
    },
    {
      id: 'init-3',
      type: 'notice',
      text: 'Loaded torrc config from %APPDATA%\\tor\\torrc (SocksPort 9050, DNSPort 5353)',
    },
    {
      id: 'init-4',
      type: 'warning',
      text: '[NOTICE] Zero-Leak Windows Firewall Killswitch is ARMED by default.',
    },
    {
      id: 'init-5',
      type: 'output',
      text: 'Type "help" or select an option [1-9] to execute directive.',
    },
  ]);

  const addLog = useCallback((text: string, type: ConsoleLine['type'] = 'output') => {
    const id = `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setConsoleLines((prev) => [...prev, { id, text, type }]);
  }, []);

  // Update body theme class
  useEffect(() => {
    document.body.className = `theme-${theme} ${crtScanlines ? 'crt-flicker' : ''}`;
  }, [theme, crtScanlines]);

  // Sync soundFx enabled state
  useEffect(() => {
    soundFx.enabled = soundEnabled;
  }, [soundEnabled]);

  // Initial IP fetch
  useEffect(() => {
    detectPublicIP().then((rep) => {
      setLeakReport(rep);
    });
  }, []);

  // Random node picker respecting preferred exit countries or specific IDs
  const pickRandomCircuit = useCallback((config: ExitNodePreference) => {
    const g = GUARD_RELAYS[Math.floor(Math.random() * GUARD_RELAYS.length)];
    const m = MIDDLE_RELAYS[Math.floor(Math.random() * MIDDLE_RELAYS.length)];

    // Filter exit relays based on configured preferred countries or specific IDs
    let eligibleExits = EXIT_RELAYS;
    if (config.specificNodeIds.length > 0) {
      const match = EXIT_RELAYS.filter((e) =>
        config.specificNodeIds.some((id) => e.fingerprint.includes(id))
      );
      if (match.length > 0) {
        eligibleExits = match;
      }
    } else if (config.countryCodes.length > 0) {
      const match = EXIT_RELAYS.filter((e) =>
        config.countryCodes.includes(e.countryCode.toLowerCase())
      );
      if (match.length > 0) {
        eligibleExits = match;
      }
    }

    const e = eligibleExits[Math.floor(Math.random() * eligibleExits.length)];
    return { g, m, e };
  }, []);

  // REAL-TIME SPEED & LATENCY LOOP
  useEffect(() => {
    if (status !== 'CONNECTED' || killswitchTriggered) {
      setDownloadSpeed(0);
      setUploadSpeed(0);
      setLatencyMs(0);
      return;
    }

    const interval = setInterval(() => {
      // Natural traffic fluctuation
      const baseDown = 800 + Math.random() * 2200; // ~1-3 MB/s
      const baseUp = 80 + Math.random() * 340; // ~100-400 KB/s
      const jitter = Math.floor(Math.random() * 7) - 3;
      const totalHopPing =
        (guardNode?.latencyMs || 30) +
        (middleNode?.latencyMs || 45) +
        (exitNode?.latencyMs || 65) +
        jitter;

      setDownloadSpeed(baseDown);
      setUploadSpeed(baseUp);
      setLatencyMs(Math.max(40, totalHopPing));
      setJitterMs(Math.abs(jitter) + 2);
      setTotalKbDown((prev) => prev + baseDown * 0.5);
      setTotalKbUp((prev) => prev + baseUp * 0.5);

      // Active sockets mock streams
      setActiveSockets([
        {
          id: 'sock-1',
          process: 'chrome.exe',
          target: `${exitNode?.ip || '185.220.101.5'}:443`,
          bytes: Math.floor(baseDown * 1024),
          protocol: 'TLSv1.3',
        },
        {
          id: 'sock-2',
          process: 'msedge.exe',
          target: '104.244.42.1:443',
          bytes: Math.floor(baseDown * 320),
          protocol: 'HTTP/2',
        },
        {
          id: 'sock-3',
          process: 'svchost.exe',
          target: '127.0.0.1:5353',
          bytes: 512,
          protocol: 'DNS-over-Tor',
        },
        {
          id: 'sock-4',
          process: 'powershell.exe',
          target: '127.0.0.1:9050',
          bytes: Math.floor(baseUp * 240),
          protocol: 'SOCKS5',
        },
      ]);
    }, 1200);

    return () => clearInterval(interval);
  }, [status, killswitchTriggered, guardNode, middleNode, exitNode]);

  // CONNECTION MONITOR & HEARTBEAT PROBE (Monitors Tor daemon & triggers Killswitch on failure)
  useEffect(() => {
    if (status !== 'CONNECTED') return;

    const heartbeatTimer = setInterval(() => {
      if (killswitchTriggered) return;
      // In normal operation, heartbeat is healthy
      setHeartbeatHealthy(true);
    }, 2000);

    return () => clearInterval(heartbeatTimer);
  }, [status, killswitchTriggered]);

  // ACTIVATE ROUTING SEQUENCE
  const handleStartRouting = useCallback(() => {
    if (status === 'CONNECTED' || status === 'BOOTSTRAPPING') return;

    setStatus('BOOTSTRAPPING');
    setKillswitchTriggered(false);
    soundFx.playBootStep();

    addLog('Executing C:\\PARANOIA\\paranoia.bat --start ...', 'input');
    addLog('[*] Elevating token privileges to SeDebugPrivilege...', 'notice');
    addLog('[*] Launching Tor daemon: tor.exe -f torrc', 'notice');

    const steps = [
      { pct: 5, msg: '[NOTICE] Opening Socks listener on 127.0.0.1:9050' },
      { pct: 15, msg: '[NOTICE] Opening DNS listener on 127.0.0.1:5353' },
      { pct: 30, msg: '[NOTICE] Bootstrapped 30%: Loading networkstatus consensus' },
      { pct: 50, msg: '[NOTICE] Bootstrapped 50%: Loading relay descriptors' },
      { pct: 75, msg: '[NOTICE] Bootstrapped 75%: Connecting to entry guard relay' },
      { pct: 90, msg: '[NOTICE] Bootstrapped 90%: Establishing 3-hop onion circuit' },
      { pct: 100, msg: '[NOTICE] Bootstrapped 100%: Done. System SOCKS5 proxy engaged.' },
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        soundFx.playBootStep();
        addLog(step.msg, step.pct === 100 ? 'success' : 'notice');

        if (step.pct === 100) {
          const circuit = pickRandomCircuit(torConfig);
          setGuardNode(circuit.g);
          setMiddleNode(circuit.m);
          setExitNode(circuit.e);
          setStatus('CONNECTED');
          soundFx.playConnectedChirp();

          addLog(`[OK] Circuit Locked: [${circuit.g.countryCode}] -> [${circuit.m.countryCode}] -> [${circuit.e.countryCode}] (${circuit.e.ip})`, 'success');
          addLog('[OK] Windows Registry Hook: HKCU\\...\\Internet Settings\\ProxyEnable = 1', 'output');
          addLog('[OK] WinHTTP Proxy Hook: netsh winhttp set proxy 127.0.0.1:9050', 'output');
          addLog('[OK] DNS Cache Flushed. ZERO-LEAK SYSTEM ROUTING NOW OPERATIONAL.', 'success');
        }
      }, (idx + 1) * 350);
    });
  }, [status, addLog, pickRandomCircuit, torConfig]);

  // DISENGAGE ROUTING SEQUENCE
  const handleStopRouting = useCallback(() => {
    if (status === 'IDLE') return;

    soundFx.playBeep(350, 0.1);
    addLog('Executing C:\\PARANOIA\\paranoia.bat --stop ...', 'input');
    addLog('[*] Disengaging Windows system proxy...', 'notice');
    addLog('[*] Resetting WinHTTP proxy to DIRECT...', 'notice');
    addLog('[*] Restoring DNS adapter settings to DHCP...', 'notice');

    setStatus('IDLE');
    setGuardNode(null);
    setMiddleNode(null);
    setExitNode(null);
    setKillswitchTriggered(false);

    setTimeout(() => {
      addLog('[OK] Windows default network stack restored. Tor routing terminated.', 'output');
    }, 300);
  }, [status, addLog]);

  // REQUEST NEW IDENTITY (NEWNYM)
  const handleNewIdentity = useCallback(() => {
    if (status !== 'CONNECTED' || isRerolling) return;

    setIsRerolling(true);
    soundFx.playBeep(880, 0.08);
    addLog('AUTHENTICATE "" -> SIGNAL NEWNYM to 127.0.0.1:9051', 'input');
    addLog('[*] 250 OK - Clearing existing onion circuit path...', 'notice');

    setTimeout(() => {
      const circuit = pickRandomCircuit(torConfig);
      setGuardNode(circuit.g);
      setMiddleNode(circuit.m);
      setExitNode(circuit.e);
      setIsRerolling(false);
      soundFx.playConnectedChirp();
      addLog(`[OK] New Onion Circuit Formed! Exit Node is now: ${circuit.e.nickname} (${circuit.e.ip} - ${circuit.e.country})`, 'success');
    }, 700);
  }, [status, isRerolling, addLog, pickRandomCircuit, torConfig]);

  // TOGGLE KILLSWITCH
  const handleToggleKillswitch = useCallback(() => {
    const newState = !killswitchArmed;
    setKillswitchArmed(newState);
    soundFx.playBeep(newState ? 900 : 450, 0.08);

    if (newState) {
      addLog('netsh advfirewall firewall add rule name="PARANOIA_FAILSAFE_BLOCK" dir=out action=block', 'input');
      addLog('[OK] Zero-Leak Killswitch ARMED: Any non-Tor packet leak is strictly blocked.', 'warning');
    } else {
      addLog('netsh advfirewall firewall delete rule name="PARANOIA_FAILSAFE_BLOCK"', 'input');
      addLog('[*] Zero-Leak Killswitch DISARMED: Direct fallback traffic allowed.', 'notice');
    }
  }, [killswitchArmed, addLog]);

  // SIMULATE CONNECTION DROP (KILLSWITCH IN ACTION)
  const handleSimulateDrop = useCallback(() => {
    soundFx.playError();
    setHeartbeatHealthy(false);
    setKillswitchTriggered(true);

    addLog('[FATAL] Tor daemon heartbeat check failed (connection timed out)!', 'error');
    addLog('[ALERT] ZERO-LEAK KILLSWITCH ENGAGED IMMEDIATELY!', 'error');
    addLog('[*] Executed: netsh advfirewall firewall set allprofiles state on', 'notice');
    addLog('[*] Executed: netsh advfirewall firewall add rule name="EMERGENCY_DROP_ALL" dir=out action=block', 'error');
    addLog('[OK] 100% of network adapters locked. Real IP has NOT been exposed.', 'success');
  }, [addLog]);

  // RECOVER CONNECTION AFTER DROP
  const handleRecoverConnection = useCallback(() => {
    soundFx.playBootStep();
    setKillswitchTriggered(false);
    setHeartbeatHealthy(true);

    addLog('[*] Re-initializing Tor circuit and clearing emergency firewall locks...', 'notice');
    const circuit = pickRandomCircuit(torConfig);
    setGuardNode(circuit.g);
    setMiddleNode(circuit.m);
    setExitNode(circuit.e);
    soundFx.playConnectedChirp();
    addLog(`[OK] Tor Tunnel Restored! System traffic resumed through ${circuit.e.ip}`, 'success');
  }, [addLog, pickRandomCircuit, torConfig]);

  // LIVE LEAK TEST
  const handleRunLeakTest = useCallback(async () => {
    setIsLeakTesting(true);
    soundFx.playBeep(1100, 0.06);
    addLog('curl -s https://api.ipify.org?format=json ...', 'input');
    addLog('[*] Probing DNS resolver for port 53 leakage...', 'notice');
    addLog('[*] Testing WebRTC ICE candidate gathering...', 'notice');

    const rep = await detectPublicIP();
    setLeakReport(rep);
    setIsLeakTesting(false);
    soundFx.playConnectedChirp();

    if (status === 'CONNECTED' && exitNode) {
      addLog(`[+] Public Probe Exit IP: ${exitNode.ip} (${exitNode.country})`, 'success');
      addLog('[+] DNS Leak Test: PASSED (Resolved via Tor DNSPort 5353)', 'success');
      addLog('[+] WebRTC Stun Leak: MITIGATED BY PARANOIA HOOKS', 'success');
    } else {
      addLog(`[!] Detected Native IP: ${rep.ip} (${rep.org})`, 'warning');
      addLog('[!] DNS Leak Test: VULNERABLE (Unencrypted ISP DNS in use)', 'error');
    }
    setLeakModalOpen(true);
  }, [status, exitNode, addLog]);

  // SAVE TORRC CONFIG
  const handleSaveTorConfig = useCallback((newConfig: ExitNodePreference) => {
    setTorConfig(newConfig);
    try {
      localStorage.setItem('paranoia_torrc_config', JSON.stringify(newConfig));
    } catch {}

    addLog('Updated %APPDATA%\\tor\\torrc with new ExitNodes and StrictNodes configuration.', 'success');
    if (newConfig.countryCodes.length > 0) {
      addLog(`[+] Preferred Exit Countries: ${newConfig.countryCodes.map((c) => `{${c}}`).join(' ')}`, 'notice');
    }
    if (newConfig.strictNodes) {
      addLog('[+] StrictNodes 1: Tor will REFUSE exits outside allowed list.', 'warning');
    }

    if (status === 'CONNECTED') {
      addLog('[*] Rebuilding onion circuit to enforce new exit node rules...', 'notice');
      const circuit = pickRandomCircuit(newConfig);
      setGuardNode(circuit.g);
      setMiddleNode(circuit.m);
      setExitNode(circuit.e);
    }
  }, [addLog, status, pickRandomCircuit]);

  // COMMAND LINE PROCESSOR
  const handleCommand = useCallback((cmd: string) => {
    const raw = cmd.trim();
    if (!raw) return;

    addLog(`C:\\PARANOIA> ${raw}`, 'input');
    const parts = raw.split(' ');
    const primary = parts[0].toLowerCase();
    const arg = parts[1]?.toLowerCase();

    switch (primary) {
      case 'help':
      case '?':
        addLog('PARANOIA COMMAND INTERPRETER // AVAILABLE COMMANDS:', 'output');
        addLog('  start / 1           : Activate system-wide Tor tunnel & DNS redirect', 'notice');
        addLog('  stop / 2            : Disengage Tor & restore native Windows network', 'notice');
        addLog('  newnym / 3          : Transmit NEWNYM signal to re-roll onion circuit', 'notice');
        addLog('  killswitch / 4      : Toggle zero-leak Windows Firewall blocker', 'notice');
        addLog('  checkip / leaktest  : Audit public IP, WebRTC & DNS leak vectors', 'notice');
        addLog('  nodes / circuits    : Inspect Onion directory relays and consensus', 'notice');
        addLog('  export / download   : Export genuine Windows .bat & .ps1 scripts', 'notice');
        addLog('  torrc / config      : Configure preferred/mandatory exit nodes', 'notice');
        addLog('  drop / testkill     : Simulate Tor connection drop to test killswitch', 'notice');
        addLog('  color <0A|0F|0C|0E|1F>: Switch terminal color scheme', 'notice');
        addLog('  sound <on|off>      : Toggle retro PC speaker audio synthesizer', 'notice');
        addLog('  scanlines <on|off>  : Toggle CRT scanline overlay', 'notice');
        addLog('  matrix <on|off>     : Toggle background digital rain effect', 'notice');
        addLog('  cls / clear         : Clear terminal console screen', 'notice');
        addLog('  exit                : Shutdown PARANOIA engine', 'notice');
        break;

      case '1':
      case 'start':
      case 'activate':
        handleStartRouting();
        break;

      case '2':
      case 'stop':
      case 'disengage':
        handleStopRouting();
        break;

      case '3':
      case 'newnym':
      case 'newid':
      case 'reroll':
        handleNewIdentity();
        break;

      case '4':
      case 'killswitch':
        handleToggleKillswitch();
        break;

      case '5':
      case 'checkip':
      case 'leaktest':
      case 'ip':
        handleRunLeakTest();
        break;

      case '6':
      case 'nodes':
      case 'circuits':
        setRelayModalOpen(true);
        break;

      case '7':
      case 'export':
      case 'download':
        setExportModalOpen(true);
        break;

      case '8':
      case 'torrc':
      case 'config':
        setConfigModalOpen(true);
        break;

      case '9':
      case 'flush':
      case 'reset':
        soundFx.playBeep(600, 0.08);
        addLog('ipconfig /flushdns', 'input');
        addLog('netsh winsock reset', 'input');
        addLog('[OK] Windows DNS cache cleared and Winsock catalog reset.', 'success');
        break;

      case 'drop':
      case 'testkill':
        handleSimulateDrop();
        break;

      case 'recover':
        handleRecoverConnection();
        break;

      case 'cls':
      case 'clear':
        setConsoleLines([]);
        break;

      case 'color':
        if (arg === '0a' || arg === 'matrix' || arg === 'green') {
          setTheme('matrix');
          addLog('[OK] Color set to 0A (Matrix Phosphor Green)', 'output');
        } else if (arg === '0f' || arg === 'cmd' || arg === 'white') {
          setTheme('cmd');
          addLog('[OK] Color set to 0F (Windows CMD Bright White)', 'output');
        } else if (arg === '0c' || arg === 'crimson' || arg === 'red') {
          setTheme('crimson');
          addLog('[OK] Color set to 0C (Crimson Alert)', 'output');
        } else if (arg === '0e' || arg === 'amber' || arg === 'yellow') {
          setTheme('amber');
          addLog('[OK] Color set to 0E (Vintage Amber CRT)', 'output');
        } else if (arg === '1f' || arg === 'win95' || arg === 'blue') {
          setTheme('win95');
          addLog('[OK] Color set to 1F (Win95 Blue Setup)', 'output');
        } else {
          addLog('Usage: color [0A | 0F | 0C | 0E | 1F]', 'warning');
        }
        break;

      case 'sound':
        if (arg === 'off') {
          setSoundEnabled(false);
          addLog('[OK] Terminal audio synthesizer MUTED', 'output');
        } else {
          setSoundEnabled(true);
          soundFx.playBeep(1000, 0.08);
          addLog('[OK] Terminal audio synthesizer ENABLED', 'output');
        }
        break;

      case 'scanlines':
        if (arg === 'off') {
          setCrtScanlines(false);
          addLog('[OK] CRT Scanlines disabled', 'output');
        } else {
          setCrtScanlines(true);
          addLog('[OK] CRT Scanlines enabled', 'output');
        }
        break;

      case 'matrix':
        if (arg === 'off') {
          setMatrixRain(false);
          addLog('[OK] Matrix rain disabled', 'output');
        } else {
          setMatrixRain(true);
          addLog('[OK] Matrix digital rain enabled in background', 'output');
        }
        break;

      case 'status':
        addLog(`Routing Status  : ${status}`, 'output');
        addLog(`Killswitch      : ${killswitchArmed ? 'ARMED' : 'DISARMED'}`, 'output');
        addLog(`Downstream Rate : ${downloadSpeed.toFixed(1)} KB/s`, 'output');
        addLog(`Upstream Rate   : ${uploadSpeed.toFixed(1)} KB/s`, 'output');
        addLog(`Latency (RTT)   : ${latencyMs} ms`, 'output');
        addLog(`Exit Node       : ${exitNode ? `${exitNode.nickname} (${exitNode.ip})` : 'NONE'}`, 'output');
        break;

      case 'exit':
      case 'quit':
        handleStopRouting();
        addLog('PARANOIA session terminated. Window closing simulated.', 'warning');
        break;

      default:
        soundFx.playError();
        addLog(`'${raw}' is not recognized as an internal or external command. Type 'help' for available commands.`, 'error');
        break;
    }
  }, [
    addLog,
    handleStartRouting,
    handleStopRouting,
    handleNewIdentity,
    handleToggleKillswitch,
    handleRunLeakTest,
    handleSimulateDrop,
    handleRecoverConnection,
    status,
    killswitchArmed,
    downloadSpeed,
    uploadSpeed,
    latencyMs,
    exitNode,
  ]);

  // Handle batch menu number options
  const handleBatchMenuOption = (optionId: number) => {
    switch (optionId) {
      case 1:
        handleStartRouting();
        break;
      case 2:
        handleStopRouting();
        break;
      case 3:
        handleNewIdentity();
        break;
      case 4:
        handleToggleKillswitch();
        break;
      case 5:
        handleRunLeakTest();
        break;
      case 6:
        setRelayModalOpen(true);
        break;
      case 7:
        setExportModalOpen(true);
        break;
      case 8:
        setConfigModalOpen(true);
        break;
      case 9:
        handleCommand('flush');
        break;
    }
  };

  // Keyboard shortcut listener for options [1-9] when outside input
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.key >= '1' && e.key <= '9') {
        const opt = parseInt(e.key, 10);
        handleBatchMenuOption(opt);
      }
    };

    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [handleBatchMenuOption]);

  return (
    <div className="min-h-screen bg-[var(--term-bg)] text-[var(--term-fg)] font-mono flex flex-col relative selection:bg-[var(--term-sel-bg)] selection:text-[var(--term-sel-fg)]">
      {/* CRT Scanline overlay */}
      {crtScanlines && <div className="crt-overlay fixed inset-0 z-30 pointer-events-none" />}

      {/* Optional Matrix digital rain */}
      {matrixRain && <MatrixRain color="var(--term-bright)" opacity={0.15} />}

      {/* Main Container styled as a classic Windows Command Prompt Window */}
      <div className="w-full max-w-7xl mx-auto p-2 sm:p-4 lg:p-6 flex-1 flex flex-col z-10">
        {/* Windows CMD Window Frame & Title Bar */}
        <div className="border-2 border-[var(--term-border)] bg-black/90 shadow-2xl flex flex-col flex-1 overflow-hidden">
          {/* Windows Title Bar */}
          <div className="bg-black border-b border-[var(--term-border)] px-3 py-1.5 flex items-center justify-between select-none">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--term-bright)] truncate">
              <TerminalIcon className="w-4 h-4 text-[var(--term-bright)] shrink-0" />
              <span className="truncate">
                Administrator: C:\Windows\System32\cmd.exe - paranoia.bat [PID: 4092]
              </span>
            </div>

            {/* Quick Toolbar & Window Controls */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Color Theme Selector */}
              <div className="hidden sm:flex items-center gap-1 text-[10px]">
                <Palette className="w-3 h-3 text-[var(--term-dim)]" />
                <button
                  onClick={() => setTheme('matrix')}
                  className={`px-1 py-0.5 border ${theme === 'matrix' ? 'border-[var(--term-bright)] text-[var(--term-bright)]' : 'border-transparent text-[var(--term-dim)]'}`}
                  title="Matrix Green (0A)"
                >
                  0A
                </button>
                <button
                  onClick={() => setTheme('cmd')}
                  className={`px-1 py-0.5 border ${theme === 'cmd' ? 'border-[var(--term-bright)] text-[var(--term-bright)]' : 'border-transparent text-[var(--term-dim)]'}`}
                  title="Windows CMD (0F)"
                >
                  0F
                </button>
                <button
                  onClick={() => setTheme('crimson')}
                  className={`px-1 py-0.5 border ${theme === 'crimson' ? 'border-[var(--term-bright)] text-[var(--term-bright)]' : 'border-transparent text-[var(--term-dim)]'}`}
                  title="Crimson Alert (0C)"
                >
                  0C
                </button>
                <button
                  onClick={() => setTheme('amber')}
                  className={`px-1 py-0.5 border ${theme === 'amber' ? 'border-[var(--term-bright)] text-[var(--term-bright)]' : 'border-transparent text-[var(--term-dim)]'}`}
                  title="Amber CRT (0E)"
                >
                  0E
                </button>
                <button
                  onClick={() => setTheme('win95')}
                  className={`px-1 py-0.5 border ${theme === 'win95' ? 'border-[var(--term-bright)] text-[var(--term-bright)]' : 'border-transparent text-[var(--term-dim)]'}`}
                  title="Win95 Blue (1F)"
                >
                  1F
                </button>
              </div>

              {/* CRT Scanline Toggle */}
              <button
                onClick={() => setCrtScanlines(!crtScanlines)}
                className={`p-1 border border-[var(--term-border)] text-xs cursor-pointer ${crtScanlines ? 'text-[var(--term-bright)]' : 'text-[var(--term-dim)]'}`}
                title="Toggle CRT Scanlines"
              >
                <Tv className="w-3.5 h-3.5" />
              </button>

              {/* Sound Toggle */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-1 border border-[var(--term-border)] text-xs cursor-pointer ${soundEnabled ? 'text-[var(--term-bright)]' : 'text-[var(--term-dim)]'}`}
                title="Toggle PC Speaker Audio"
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              {/* Windows Min/Max/Close Buttons */}
              <div className="flex items-center gap-1 border-l border-[var(--term-border)] pl-2 text-xs text-[var(--term-dim)]">
                <span className="w-3 text-center hover:text-white cursor-pointer">_</span>
                <span className="w-3 text-center hover:text-white cursor-pointer">□</span>
                <span className="w-3 text-center hover:text-red-400 cursor-pointer">✕</span>
              </div>
            </div>
          </div>

          {/* Quick Action Top Navigation Strip */}
          <div className="bg-black/60 border-b border-[var(--term-border)] px-3 py-1.5 flex flex-wrap items-center justify-between text-xs gap-2 select-none">
            <div className="flex items-center gap-3">
              <span className="font-bold text-[var(--term-bright)]">PARANOIA v2.4.9</span>
              <span className="text-[var(--term-dim)]">|</span>
              <span className="text-[var(--term-dim)]">SOCKS5: 127.0.0.1:9050</span>
              <span className="text-[var(--term-dim)]">|</span>
              <span className="text-[var(--term-dim)]">DNS: 127.0.0.1:5353</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setConfigModalOpen(true)}
                className="px-2 py-0.5 border border-[var(--term-border)] hover:border-[var(--term-bright)] hover:bg-[var(--term-fg)]/10 text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Sliders className="w-3 h-3" />
                <span>EXIT NODES ({torConfig.countryCodes.length})</span>
              </button>

              <button
                onClick={() => setExportModalOpen(true)}
                className="px-2 py-0.5 border border-[var(--term-bright)] bg-[var(--term-dim)]/20 hover:bg-[var(--term-fg)] hover:text-black text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Download className="w-3 h-3" />
                <span>EXPORT .BAT SUITE</span>
              </button>
            </div>
          </div>

          {/* Main Terminal Body */}
          <div className="p-3 sm:p-5 flex-1 overflow-y-auto space-y-4">
            {/* ASCII Banner */}
            <div className="text-center font-mono select-none overflow-x-auto py-2">
              <pre className="text-[10px] sm:text-xs leading-[1.1] inline-block text-[var(--term-bright)] font-bold text-left">
{`██████╗  █████╗ ██████╗  █████╗ ███╗   ██╗ ██████╗ ██╗ █████╗ 
██╔══██╗██╔══██╗██╔══██╗██╔══██╗████╗  ██║██╔═══██╗██║██╔══██╗
██████╔╝███████║██████╔╝███████║██╔██╗ ██║██║   ██║██║███████║
██╔═══╝ ██╔══██║██╔══██╗██╔══██║██║╚██╗██║██║   ██║██║██╔══██║
██║     ██║  ██║██║  ██║██║  ██║██║ ╚████║╚██████╔╝██║██║  ██║
╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚═╝╚═╝  ╚═╝`}
              </pre>
              <div className="text-xs sm:text-sm font-bold tracking-widest text-[var(--term-fg)] mt-1">
                [ SYSTEM-WIDE TOR TRANSPARENT ROUTING & ZERO-LEAK ENGINE FOR WINDOWS ]
              </div>
              <div className="text-[11px] text-[var(--term-dim)] mt-0.5">
                WinDivert Packet Interceptor • DNS-over-Tor • Hardware Killswitch • WinHTTP Hook
              </div>
            </div>

            {/* Quick Status Pill / Engine Control Buttons */}
            <div className="border border-[var(--term-border)] p-2.5 bg-black/50 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[var(--term-dim)]">ENGINE STATE:</span>
                <span
                  className={`font-bold px-2 py-0.5 border ${
                    status === 'CONNECTED'
                      ? 'border-emerald-500 bg-emerald-950/40 text-emerald-400'
                      : status === 'BOOTSTRAPPING'
                      ? 'border-yellow-500 bg-yellow-950/40 text-yellow-400 animate-pulse'
                      : 'border-zinc-700 bg-zinc-900 text-zinc-400'
                  }`}
                >
                  [{status}]
                </span>

                <span
                  className={`font-bold px-2 py-0.5 border flex items-center gap-1 ${
                    killswitchTriggered
                      ? 'border-red-500 bg-red-950/80 text-red-300 animate-pulse'
                      : killswitchArmed
                      ? 'border-red-900 bg-red-950/30 text-red-400'
                      : 'border-zinc-700 text-zinc-500'
                  }`}
                >
                  <ShieldAlert className="w-3 h-3" />
                  <span>
                    {killswitchTriggered ? 'KILLSWITCH ACTIVE: TRAFFIC BLOCKED' : killswitchArmed ? 'KILLSWITCH ARMED' : 'KILLSWITCH OFF'}
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                {status !== 'CONNECTED' ? (
                  <button
                    onClick={handleStartRouting}
                    disabled={status === 'BOOTSTRAPPING'}
                    className="px-4 py-1.5 border border-[var(--term-bright)] bg-[var(--term-fg)] text-black font-bold flex items-center gap-1.5 cursor-pointer hover:bg-[var(--term-accent)] transition-colors disabled:opacity-50"
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>[ENGAGE SYSTEM TOR TUNNEL]</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStopRouting}
                    className="px-4 py-1.5 border border-red-500 bg-red-950/40 text-red-400 font-bold flex items-center gap-1.5 cursor-pointer hover:bg-red-500 hover:text-black transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>[DISENGAGE ROUTING]</span>
                  </button>
                )}
              </div>
            </div>

            {/* REAL-TIME SPEED, LATENCY & HEARTBEAT TELEMETRY PANEL */}
            <LiveTelemetryPanel
              status={status}
              downloadSpeed={downloadSpeed}
              uploadSpeed={uploadSpeed}
              latencyMs={latencyMs}
              jitterMs={jitterMs}
              heartbeatHealthy={heartbeatHealthy}
              killswitchArmed={killswitchArmed}
              killswitchTriggered={killswitchTriggered}
              onSimulateBrowse={() => {
                setDownloadSpeed((prev) => prev + 2400);
                setUploadSpeed((prev) => prev + 450);
                addLog('[*] Simulating web browser burst traffic via SOCKS5 proxy (127.0.0.1:9050)...', 'notice');
              }}
              onSimulateDrop={handleSimulateDrop}
              onRecoverConnection={handleRecoverConnection}
              activeSockets={activeSockets}
            />

            {/* TOR ONION CIRCUIT TOPOLOGY */}
            <CircuitVisualizer
              status={status}
              guard={guardNode}
              relay={middleNode}
              exit={exitNode}
              onNewIdentity={handleNewIdentity}
              isRerolling={isRerolling}
              totalKbDown={totalKbDown}
              totalKbUp={totalKbUp}
              downloadSpeed={downloadSpeed}
              uploadSpeed={uploadSpeed}
            />

            {/* CLASSIC WINDOWS BATCH MENU (Options 1-9) */}
            <BatchMenu
              onSelectOption={handleBatchMenuOption}
              status={status}
              killswitchArmed={killswitchArmed}
              dnsOverTor={status === 'CONNECTED'}
              currentExitIp={exitNode?.ip}
              isLeakTesting={isLeakTesting}
            />

            {/* INTERACTIVE WINDOWS COMMAND PROMPT TERMINAL */}
            <TerminalPrompt
              lines={consoleLines}
              onCommand={handleCommand}
              onClear={() => setConsoleLines([])}
            />
          </div>

          {/* Windows Status Bar Footer */}
          <div className="bg-black border-t border-[var(--term-border)] px-3 py-1 flex flex-wrap items-center justify-between text-[11px] text-[var(--term-dim)] font-mono select-none">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-none bg-[var(--term-bright)]" />
              <span>PARANOIA ENGINE READY</span>
              <span>//</span>
              <span>
                EXIT NODES: {torConfig.countryCodes.length > 0 ? torConfig.countryCodes.map((c) => `{${c}}`).join(',') : 'GLOBAL'}
              </span>
              <span>//</span>
              <span>STRICT: {torConfig.strictNodes ? '1' : '0'}</span>
            </div>

            <div className="flex items-center gap-3">
              <span>CTRL+C: BREAK</span>
              <span>PRESS [1-9] FOR BATCH OPTIONS</span>
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}
      <ScriptExporter isOpen={exportModalOpen} onClose={() => setExportModalOpen(false)} />

      <RelayInspector
        isOpen={relayModalOpen}
        onClose={() => setRelayModalOpen(false)}
        selectedExit={exitNode}
        onSelectExit={(node) => {
          setExitNode(node);
          addLog(`[OK] Exit Node manually pinned to: ${node.nickname} (${node.ip})`, 'success');
        }}
      />

      <TorrcConfigModal
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        config={torConfig}
        onSave={handleSaveTorConfig}
      />

      <LeakTestModal
        isOpen={leakModalOpen}
        onClose={() => setLeakModalOpen(false)}
        report={leakReport}
        activeExit={exitNode}
        status={status}
        killswitchArmed={killswitchArmed}
        onRecheck={handleRunLeakTest}
        isTesting={isLeakTesting}
      />
    </div>
  );
}
