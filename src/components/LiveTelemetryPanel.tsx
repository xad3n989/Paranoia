import React from 'react';
import { Activity, ShieldAlert, Wifi, ArrowDown, ArrowUp, AlertTriangle } from 'lucide-react';
import { soundFx } from '../utils/audio';

interface LiveTelemetryPanelProps {
  status: 'IDLE' | 'BOOTSTRAPPING' | 'CONNECTED' | 'TERMINATING';
  downloadSpeed: number; // in KB/s
  uploadSpeed: number; // in KB/s
  latencyMs: number;
  jitterMs: number;
  heartbeatHealthy: boolean;
  killswitchArmed: boolean;
  killswitchTriggered: boolean;
  onSimulateBrowse: () => void;
  onSimulateDrop: () => void;
  onRecoverConnection: () => void;
  activeSockets: Array<{
    id: string;
    process: string;
    target: string;
    bytes: number;
    protocol: string;
  }>;
}

export const LiveTelemetryPanel: React.FC<LiveTelemetryPanelProps> = ({
  status,
  downloadSpeed,
  uploadSpeed,
  latencyMs,
  jitterMs,
  heartbeatHealthy,
  killswitchArmed,
  killswitchTriggered,
  onSimulateBrowse,
  onSimulateDrop,
  onRecoverConnection,
  activeSockets,
}) => {
  const isConnected = status === 'CONNECTED';

  // Generate ASCII progress bar
  const getAsciiBar = (val: number, maxVal: number, totalChars = 14) => {
    const ratio = Math.min(1, Math.max(0, val / maxVal));
    const filled = Math.round(ratio * totalChars);
    const empty = totalChars - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  };

  return (
    <div className="border border-[var(--term-border)] bg-[var(--term-bg)] p-3 sm:p-4 mb-4 font-mono select-none">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-[var(--term-border)] pb-2 mb-3 gap-2">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[var(--term-bright)]">
          <Activity className="w-4 h-4" />
          <span>REAL-TIME NETWORK SPEED & LATENCY MONITOR</span>
        </div>
        <div className="flex items-center gap-2">
          {isConnected && !killswitchTriggered && (
            <button
              onClick={() => {
                soundFx.playBeep(1200, 0.04);
                onSimulateBrowse();
              }}
              className="text-xs px-2.5 py-1 border border-[var(--term-border)] bg-[var(--term-dim)]/20 hover:bg-[var(--term-fg)] hover:text-black transition-colors cursor-pointer"
              title="Generate browse traffic to see dynamic speed fluctuations"
            >
              [BROWSE / BURST TRAFFIC]
            </button>
          )}

          {isConnected && killswitchArmed && !killswitchTriggered && (
            <button
              onClick={() => {
                soundFx.playError();
                onSimulateDrop();
              }}
              className="text-xs px-2.5 py-1 border border-red-500 bg-red-950/40 text-red-400 hover:bg-red-500 hover:text-black transition-colors cursor-pointer font-bold"
              title="Test the Killswitch by simulating a connection interruption"
            >
              [TEST KILLSWITCH INTERRUPT]
            </button>
          )}
        </div>
      </div>

      {/* KILLSWITCH TRIGGERED EMERGENCY BANNER */}
      {killswitchTriggered && (
        <div className="mb-4 border-2 border-red-500 bg-red-950/80 p-3 sm:p-4 text-red-200 animate-pulse">
          <div className="flex items-center gap-2 font-bold text-sm sm:text-base text-red-400 mb-1">
            <ShieldAlert className="w-5 h-5 text-red-400 animate-bounce" />
            <span>CRITICAL: TOR CONNECTION INTERRUPTED! ZERO-LEAK KILLSWITCH ENGAGED!</span>
          </div>
          <p className="text-xs text-red-300 leading-relaxed font-mono">
            Heartbeat signal to Tor Daemon (127.0.0.1:9051) failed. Windows Firewall has blocked ALL outbound internet
            packets across Wi-Fi and Ethernet adapters to guarantee your real IP is never exposed.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => {
                soundFx.playConnectedChirp();
                onRecoverConnection();
              }}
              className="px-3 py-1.5 bg-red-500 text-black font-bold text-xs hover:bg-red-400 cursor-pointer border border-red-300"
            >
              RE-ESTABLISH TOR CONNECTION & UNBLOCK
            </button>
          </div>
        </div>
      )}

      {/* Telemetry Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        {/* Metric 1: Download Speed */}
        <div className="border border-[var(--term-border)] p-2.5 bg-black/50">
          <div className="flex items-center justify-between text-[10px] text-[var(--term-dim)] font-bold mb-1">
            <span className="flex items-center gap-1">
              <ArrowDown className="w-3 h-3 text-[var(--term-bright)]" />
              <span>DOWNSTREAM RATE</span>
            </span>
            <span className="text-[var(--term-bright)] font-mono tabular-nums">
              {downloadSpeed.toFixed(1)} KB/s
            </span>
          </div>
          <div className="text-[11px] font-mono text-[var(--term-bright)] mb-1">
            [{getAsciiBar(downloadSpeed, 5000, 16)}]
          </div>
          <div className="text-[10px] text-[var(--term-dim)] flex justify-between">
            <span>PEAK: 4.8 MB/s</span>
            <span>CHUNKS: 4096B</span>
          </div>
        </div>

        {/* Metric 2: Upload Speed */}
        <div className="border border-[var(--term-border)] p-2.5 bg-black/50">
          <div className="flex items-center justify-between text-[10px] text-[var(--term-dim)] font-bold mb-1">
            <span className="flex items-center gap-1">
              <ArrowUp className="w-3 h-3 text-[var(--term-bright)]" />
              <span>UPSTREAM RATE</span>
            </span>
            <span className="text-[var(--term-bright)] font-mono tabular-nums">
              {uploadSpeed.toFixed(1)} KB/s
            </span>
          </div>
          <div className="text-[11px] font-mono text-[var(--term-bright)] mb-1">
            [{getAsciiBar(uploadSpeed, 1000, 16)}]
          </div>
          <div className="text-[10px] text-[var(--term-dim)] flex justify-between">
            <span>PEAK: 920 KB/s</span>
            <span>CELL: 512B</span>
          </div>
        </div>

        {/* Metric 3: Real-Time Latency (RTT) */}
        <div className="border border-[var(--term-border)] p-2.5 bg-black/50">
          <div className="flex items-center justify-between text-[10px] text-[var(--term-dim)] font-bold mb-1">
            <span className="flex items-center gap-1">
              <Wifi className="w-3 h-3 text-[var(--term-bright)]" />
              <span>END-TO-END LATENCY</span>
            </span>
            <span
              className={`font-mono tabular-nums font-bold ${
                latencyMs > 250
                  ? 'text-amber-400'
                  : isConnected
                  ? 'text-[var(--term-bright)]'
                  : 'text-zinc-500'
              }`}
            >
              {isConnected ? `${latencyMs} ms` : 'OFFLINE'}
            </span>
          </div>
          <div className="text-xs font-bold text-[var(--term-bright)] mb-1">
            {isConnected ? (
              <span>
                JITTER: ±{jitterMs}ms // LOSS: 0.0%
              </span>
            ) : (
              <span className="text-[var(--term-dim)]">NO ACTIVE CIRCUIT</span>
            )}
          </div>
          <div className="text-[10px] text-[var(--term-dim)] flex justify-between">
            <span>3-HOP ACCUMULATOR</span>
            <span>TLS 1.3</span>
          </div>
        </div>

        {/* Metric 4: Connection Health & Killswitch Guard */}
        <div className="border border-[var(--term-border)] p-2.5 bg-black/50">
          <div className="flex items-center justify-between text-[10px] text-[var(--term-dim)] font-bold mb-1">
            <span className="flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-[var(--term-bright)]" />
              <span>FAILSAFE INTEGRITY</span>
            </span>
            <span
              className={`font-mono text-[10px] font-bold ${
                killswitchTriggered
                  ? 'text-red-400'
                  : killswitchArmed
                  ? 'text-[var(--term-bright)]'
                  : 'text-zinc-500'
              }`}
            >
              {killswitchTriggered ? 'BLOCKED' : killswitchArmed ? 'ARMED' : 'UNARMED'}
            </span>
          </div>
          <div className="text-xs font-bold truncate">
            {heartbeatHealthy && isConnected ? (
              <span className="text-[var(--term-bright)]">PULSE: STEADY (200ms)</span>
            ) : killswitchTriggered ? (
              <span className="text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> INTERRUPTED
              </span>
            ) : (
              <span className="text-[var(--term-dim)]">STANDBY</span>
            )}
          </div>
          <div className="text-[10px] text-[var(--term-dim)] flex justify-between mt-1">
            <span>WIN_FIREWALL</span>
            <span>ZERO-LEAK</span>
          </div>
        </div>
      </div>

      {/* Active Tunneled Windows Sockets Stream Table */}
      {isConnected && (
        <div className="border border-[var(--term-border)]/60 bg-black/60 p-2.5">
          <div className="flex items-center justify-between text-[10px] text-[var(--term-dim)] font-bold border-b border-[var(--term-border)]/40 pb-1 mb-2">
            <span>LIVE WIN32 SOCKETS TUNNELED VIA TOR SOCKS5 (127.0.0.1:9050)</span>
            <span className="text-[var(--term-bright)]">{activeSockets.length} STREAMS ACTIVE</span>
          </div>
          <div className="space-y-1">
            {activeSockets.slice(0, 4).map((sock) => (
              <div
                key={sock.id}
                className="flex items-center justify-between text-[11px] font-mono text-[var(--term-dim)] hover:text-[var(--term-fg)]"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-[var(--term-bright)] font-bold">{sock.process}</span>
                  <span>→</span>
                  <span className="truncate">{sock.target}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[9px] px-1 py-0.2 border border-[var(--term-border)] text-[var(--term-bright)]">
                    {sock.protocol}
                  </span>
                  <span className="tabular-nums">{(sock.bytes / 1024).toFixed(1)} KB</span>
                  <span className="text-[var(--term-bright)] text-[10px]">[ENCRYPTED]</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
