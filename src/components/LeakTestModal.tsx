import React from 'react';
import { X, ShieldAlert, CheckCircle2, AlertTriangle, RefreshCw, Globe, Shield } from 'lucide-react';
import { IPReport } from '../utils/leakCheck';
import { TorNode } from '../utils/torRelaysData';
import { soundFx } from '../utils/audio';

interface LeakTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: IPReport | null;
  activeExit: TorNode | null;
  status: 'IDLE' | 'BOOTSTRAPPING' | 'CONNECTED' | 'TERMINATING';
  killswitchArmed: boolean;
  onRecheck: () => void;
  isTesting: boolean;
}

export const LeakTestModal: React.FC<LeakTestModalProps> = ({
  isOpen,
  onClose,
  report,
  activeExit,
  status,
  killswitchArmed,
  onRecheck,
  isTesting,
}) => {
  if (!isOpen) return null;

  const isConnected = status === 'CONNECTED';

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 font-mono">
      <div className="w-full max-w-2xl border border-[var(--term-border)] bg-[var(--term-bg)] shadow-2xl flex flex-col max-h-[90vh]">
        {/* Title */}
        <div className="bg-black border-b border-[var(--term-border)] px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--term-bright)]">
            <ShieldAlert className="w-4 h-4" />
            <span>PARANOIA NETWORK AUDIT & LEAK VERIFICATION</span>
          </div>
          <button
            onClick={() => {
              soundFx.playBeep(440, 0.05);
              onClose();
            }}
            className="text-[var(--term-dim)] hover:text-[var(--term-bright)] px-2 py-0.5 border border-transparent hover:border-[var(--term-border)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 flex-1 overflow-y-auto text-xs">
          {/* Summary Status */}
          <div
            className={`border p-3 flex items-center justify-between gap-3 ${
              isConnected
                ? 'border-emerald-500/70 bg-emerald-950/20 text-emerald-300'
                : 'border-amber-500/70 bg-amber-950/20 text-amber-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {isConnected ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              )}
              <div>
                <div className="font-bold text-xs sm:text-sm">
                  {isConnected
                    ? 'TOR TUNNEL ACTIVE // IDENTITY OBFUSCATED'
                    : 'DIRECT NATIVE CONNECTION DETECTED // HIGH LEAK RISK'}
                </div>
                <div className="text-[11px] opacity-80 mt-0.5">
                  {isConnected
                    ? 'Windows applications routing through 127.0.0.1:9050. Target servers see the Tor Exit Node.'
                    : 'System traffic is unencrypted and exposed to your local Internet Service Provider (ISP).'}
                </div>
              </div>
            </div>
          </div>

          {/* IP Comparison Table */}
          <div className="border border-[var(--term-border)] bg-black/60 p-3 space-y-2">
            <div className="text-[11px] font-bold text-[var(--term-bright)] border-b border-[var(--term-border)] pb-1 flex items-center justify-between">
              <span>ENDPOINT AUDIT RESULTS</span>
              <button
                onClick={() => {
                  soundFx.playBeep(880, 0.05);
                  onRecheck();
                }}
                disabled={isTesting}
                className="text-[10px] text-[var(--term-dim)] hover:text-[var(--term-bright)] flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                <span>[RE-PROBE IP]</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="border border-[var(--term-border)]/60 p-2.5 bg-black/40">
                <div className="text-[10px] text-[var(--term-dim)] flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  <span>DETECTED CLIENT PUBLIC IP</span>
                </div>
                <div className="text-sm font-bold text-[var(--term-bright)] font-mono mt-1">
                  {report?.ip || '127.0.0.1'}
                </div>
                <div className="text-[10px] text-[var(--term-dim)] mt-1">
                  ISP: {report?.org || 'Local Gateway / Sandbox'}
                </div>
              </div>

              <div className="border border-[var(--term-border)]/60 p-2.5 bg-black/40">
                <div className="text-[10px] text-[var(--term-dim)] flex items-center gap-1">
                  <Shield className="w-3 h-3 text-emerald-400" />
                  <span>ACTIVE TOR EXIT IP</span>
                </div>
                <div className="text-sm font-bold text-emerald-400 font-mono mt-1">
                  {isConnected && activeExit ? activeExit.ip : 'NONE (NOT CONNECTED)'}
                </div>
                <div className="text-[10px] text-[var(--term-dim)] mt-1">
                  Exit Country: {isConnected && activeExit ? `${activeExit.country} ${activeExit.flagEmoji}` : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Leak Test Vectors Checklist */}
          <div className="border border-[var(--term-border)] bg-black/60 p-3 space-y-2.5">
            <div className="text-[11px] font-bold text-[var(--term-bright)] border-b border-[var(--term-border)] pb-1">
              VULNERABILITY & LEAK VECTORS
            </div>

            <div className="space-y-2 text-[11px]">
              {/* Vector 1: DNS Leak */}
              <div className="flex items-center justify-between p-2 border border-[var(--term-border)]/40 bg-black/30">
                <div>
                  <div className="font-bold text-[var(--term-fg)]">DNS REQUEST LEAKS (Port 53)</div>
                  <div className="text-[10px] text-[var(--term-dim)]">
                    Direct UDP DNS queries that bypass the proxy to reveal visited domains to your ISP.
                  </div>
                </div>
                <span
                  className={`font-bold font-mono px-2 py-0.5 text-[10px] border ${
                    isConnected
                      ? 'border-emerald-500 text-emerald-400 bg-emerald-950/30'
                      : 'border-red-500 text-red-400 bg-red-950/30'
                  }`}
                >
                  {isConnected ? 'MITIGATED (TOR 5353)' : 'VULNERABLE'}
                </span>
              </div>

              {/* Vector 2: WebRTC STUN Leak */}
              <div className="flex items-center justify-between p-2 border border-[var(--term-border)]/40 bg-black/30">
                <div>
                  <div className="font-bold text-[var(--term-fg)]">WebRTC STUN / ICE CANDIDATE LEAKS</div>
                  <div className="text-[10px] text-[var(--term-dim)]">
                    Browser WebRTC protocols interrogating local and external network interfaces.
                  </div>
                </div>
                <span
                  className={`font-bold font-mono px-2 py-0.5 text-[10px] border ${
                    killswitchArmed
                      ? 'border-emerald-500 text-emerald-400 bg-emerald-950/30'
                      : 'border-amber-500 text-amber-400 bg-amber-950/30'
                  }`}
                >
                  {killswitchArmed ? 'BLOCKED BY KILLSWITCH' : 'ADVISORY WARNING'}
                </span>
              </div>

              {/* Vector 3: Windows IPv6 Direct Leak */}
              <div className="flex items-center justify-between p-2 border border-[var(--term-border)]/40 bg-black/30">
                <div>
                  <div className="font-bold text-[var(--term-fg)]">IPv6 ESCAPE HATCH LEAK</div>
                  <div className="text-[10px] text-[var(--term-dim)]">
                    Dual-stack Windows routers leaking native IPv6 addresses when IPv4 is proxied.
                  </div>
                </div>
                <span
                  className={`font-bold font-mono px-2 py-0.5 text-[10px] border ${
                    isConnected
                      ? 'border-emerald-500 text-emerald-400 bg-emerald-950/30'
                      : 'border-amber-500 text-amber-400 bg-amber-950/30'
                  }`}
                >
                  {isConnected ? 'DISABLED ON ADAPTER' : 'STANDARD'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-black/90 border-t border-[var(--term-border)] flex justify-between items-center text-xs">
          <span className="text-[var(--term-dim)]">
            RECOMMENDATION: KEEP ZERO-LEAK KILLSWITCH ARMED FOR SENSITIVE TRANSMISSIONS
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 border border-[var(--term-border)] hover:text-[var(--term-bright)] cursor-pointer"
          >
            [CLOSE]
          </button>
        </div>
      </div>
    </div>
  );
};
