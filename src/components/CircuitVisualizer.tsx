import React from 'react';
import { TorNode } from '../utils/torRelaysData';
import { ShieldCheck, RefreshCw, Lock, ArrowRight, Laptop, Globe } from 'lucide-react';
import { soundFx } from '../utils/audio';

interface CircuitVisualizerProps {
  status: 'IDLE' | 'BOOTSTRAPPING' | 'CONNECTED' | 'TERMINATING';
  guard: TorNode | null;
  relay: TorNode | null;
  exit: TorNode | null;
  onNewIdentity: () => void;
  isRerolling: boolean;
  totalKbDown: number;
  totalKbUp: number;
  downloadSpeed: number;
  uploadSpeed: number;
}

export const CircuitVisualizer: React.FC<CircuitVisualizerProps> = ({
  status,
  guard,
  relay,
  exit,
  onNewIdentity,
  isRerolling,
  totalKbDown,
  totalKbUp,
  downloadSpeed,
  uploadSpeed,
}) => {
  const isConnected = status === 'CONNECTED';

  return (
    <div className="border border-[var(--term-border)] bg-[var(--term-bg)]/80 p-3 sm:p-4 mb-4">
      <div className="flex flex-wrap items-center justify-between border-b border-[var(--term-border)] pb-2 mb-3 gap-2">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold tracking-wider">
          <ShieldCheck className="w-4 h-4 text-[var(--term-bright)]" />
          <span>TOR ONION CIRCUIT TOPOLOGY // 3-LAYER ENCRYPTION</span>
        </div>
        <div className="flex items-center gap-2">
          {isConnected && (
            <button
              onClick={() => {
                soundFx.playBeep(980, 0.06);
                onNewIdentity();
              }}
              disabled={isRerolling}
              className="text-xs px-2.5 py-1 border border-[var(--term-border)] bg-[var(--term-dim)]/20 hover:bg-[var(--term-fg)] hover:text-black transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Request New Identity (NEWNYM)"
            >
              <RefreshCw className={`w-3 h-3 ${isRerolling ? 'animate-spin' : ''}`} />
              <span>[RE-ROLL CIRCUIT]</span>
            </button>
          )}
        </div>
      </div>

      {!isConnected && (
        <div className="py-6 text-center text-xs text-[var(--term-dim)] font-mono">
          {status === 'BOOTSTRAPPING' ? (
            <span className="text-[var(--term-bright)] animate-pulse">
              [~] NEGOTIATING ONION CIRCUITS & FETCHING CONSENSUS DESCRIPTORS...
            </span>
          ) : (
            <span>[-] CIRCUIT INACTIVE. ACTIVATE SYSTEM TOR ROUTING TO ESTABLISH ONION TUNNEL.</span>
          )}
        </div>
      )}

      {isConnected && guard && relay && exit && (
        <>
          {/* Circuit Hops Ribbon */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 my-2">
            {/* Hop 0: Localhost */}
            <div className="border border-[var(--term-border)] p-2.5 bg-black/40 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[10px] text-[var(--term-dim)] font-bold mb-1">
                  <span>LOCAL ORIGIN</span>
                  <Laptop className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs font-bold text-[var(--term-bright)] truncate">
                  Windows PC (127.0.0.1)
                </div>
                <div className="text-[11px] text-[var(--term-dim)] mt-1">
                  Adapter: WinDivert / SOCKS5
                </div>
              </div>
              <div className="mt-2 pt-1 border-t border-[var(--term-border)]/50 text-[10px] text-[var(--term-dim)]">
                Port: 9050 / DNS: 5353
              </div>
            </div>

            {/* Hop 1: Guard Node */}
            <div className="border border-[var(--term-border)] p-2.5 bg-black/40 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[10px] text-[var(--term-dim)] font-bold mb-1">
                  <span className="flex items-center gap-1">
                    <span>HOP 1: GUARD</span>
                    <span>{guard.flagEmoji}</span>
                  </span>
                  <Lock className="w-3.5 h-3.5 text-[var(--term-bright)]" />
                </div>
                <div className="text-xs font-bold text-[var(--term-bright)] truncate">
                  {guard.nickname}
                </div>
                <div className="text-[11px] text-[var(--term-dim)] font-mono truncate">
                  {guard.ip}:{guard.port}
                </div>
              </div>
              <div className="mt-2 pt-1 border-t border-[var(--term-border)]/50 flex justify-between text-[10px]">
                <span className="text-[var(--term-dim)]">{guard.country}</span>
                <span className="tabular-nums font-mono">{guard.latencyMs}ms</span>
              </div>
            </div>

            {/* Hop 2: Middle Relay */}
            <div className="border border-[var(--term-border)] p-2.5 bg-black/40 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[10px] text-[var(--term-dim)] font-bold mb-1">
                  <span className="flex items-center gap-1">
                    <span>HOP 2: MIDDLE</span>
                    <span>{relay.flagEmoji}</span>
                  </span>
                  <Lock className="w-3.5 h-3.5 text-[var(--term-bright)]" />
                </div>
                <div className="text-xs font-bold text-[var(--term-bright)] truncate">
                  {relay.nickname}
                </div>
                <div className="text-[11px] text-[var(--term-dim)] font-mono truncate">
                  {relay.ip}:{relay.port}
                </div>
              </div>
              <div className="mt-2 pt-1 border-t border-[var(--term-border)]/50 flex justify-between text-[10px]">
                <span className="text-[var(--term-dim)]">{relay.country}</span>
                <span className="tabular-nums font-mono">{relay.latencyMs}ms</span>
              </div>
            </div>

            {/* Hop 3: Exit Node */}
            <div className="border border-emerald-500/70 p-2.5 bg-emerald-950/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[10px] text-emerald-400 font-bold mb-1">
                  <span className="flex items-center gap-1">
                    <span>HOP 3: EXIT (PUBLIC IP)</span>
                    <span>{exit.flagEmoji}</span>
                  </span>
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-xs font-bold text-emerald-300 truncate">
                  {exit.nickname}
                </div>
                <div className="text-[11px] font-mono text-emerald-400 font-bold truncate">
                  {exit.ip}
                </div>
              </div>
              <div className="mt-2 pt-1 border-t border-emerald-500/40 flex justify-between text-[10px]">
                <span className="text-emerald-400/80">{exit.country}</span>
                <span className="tabular-nums font-mono">{exit.latencyMs}ms</span>
              </div>
            </div>
          </div>

          {/* ASCII visual diagram */}
          <div className="hidden lg:flex items-center justify-between text-[11px] font-mono text-[var(--term-dim)] px-2 py-1 bg-black/60 border border-[var(--term-border)]/40 my-2">
            <span>[HOST]</span>
            <ArrowRight className="w-3 h-3 text-[var(--term-fg)] animate-pulse" />
            <span>(TLS 1.3 / aes-256-gcm)</span>
            <ArrowRight className="w-3 h-3 text-[var(--term-fg)]" />
            <span>[GUARD: {guard.countryCode}]</span>
            <ArrowRight className="w-3 h-3 text-[var(--term-fg)] animate-pulse" />
            <span>[MIDDLE: {relay.countryCode}]</span>
            <ArrowRight className="w-3 h-3 text-[var(--term-fg)]" />
            <span>[EXIT: {exit.countryCode} // {exit.ip}]</span>
            <ArrowRight className="w-3 h-3 text-[var(--term-fg)]" />
            <span className="text-[var(--term-bright)]">[GLOBAL INTERNET]</span>
          </div>

          {/* Live Telemetry Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[var(--term-border)]/50 text-[11px] font-mono">
            <div>
              <span className="text-[var(--term-dim)]">DOWN SPEED: </span>
              <span className="tabular-nums text-[var(--term-bright)] font-bold">{downloadSpeed.toFixed(1)} KB/s</span>
            </div>
            <div>
              <span className="text-[var(--term-dim)]">UP SPEED: </span>
              <span className="tabular-nums text-[var(--term-bright)] font-bold">{uploadSpeed.toFixed(1)} KB/s</span>
            </div>
            <div>
              <span className="text-[var(--term-dim)]">TOTAL DOWN: </span>
              <span className="tabular-nums">{(totalKbDown / 1024).toFixed(2)} MB</span>
            </div>
            <div>
              <span className="text-[var(--term-dim)]">TOTAL UP: </span>
              <span className="tabular-nums">{(totalKbUp / 1024).toFixed(2)} MB</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
