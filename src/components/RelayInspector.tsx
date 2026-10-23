import React, { useState } from 'react';
import { GUARD_RELAYS, MIDDLE_RELAYS, EXIT_RELAYS, TorNode } from '../utils/torRelaysData';
import { X, Network, Server, Shield, Check } from 'lucide-react';
import { soundFx } from '../utils/audio';

interface RelayInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  selectedExit: TorNode | null;
  onSelectExit: (node: TorNode) => void;
}

export const RelayInspector: React.FC<RelayInspectorProps> = ({
  isOpen,
  onClose,
  selectedExit,
  onSelectExit,
}) => {
  const [activeCategory, setActiveCategory] = useState<'guards' | 'middle' | 'exits'>('exits');

  if (!isOpen) return null;

  const getList = () => {
    switch (activeCategory) {
      case 'guards':
        return GUARD_RELAYS;
      case 'middle':
        return MIDDLE_RELAYS;
      case 'exits':
        return EXIT_RELAYS;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 font-mono">
      <div className="w-full max-w-4xl border border-[var(--term-border)] bg-[var(--term-bg)] shadow-2xl flex flex-col max-h-[90vh]">
        {/* Title Bar */}
        <div className="bg-black border-b border-[var(--term-border)] px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--term-bright)]">
            <Network className="w-4 h-4" />
            <span>TOR RELAY DIRECTORY & CONSENSUS TOPOLOGY</span>
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

        {/* Category Tabs */}
        <div className="flex border-b border-[var(--term-border)] bg-black/40 text-xs">
          <button
            onClick={() => {
              soundFx.playBeep(880, 0.04);
              setActiveCategory('exits');
            }}
            className={`px-4 py-2 border-r border-[var(--term-border)] flex items-center gap-2 cursor-pointer ${
              activeCategory === 'exits'
                ? 'bg-[var(--term-bg)] text-[var(--term-bright)] font-bold border-b-2 border-b-[var(--term-bright)]'
                : 'text-[var(--term-dim)] hover:text-[var(--term-fg)]'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>EXIT RELAYS ({EXIT_RELAYS.length})</span>
          </button>
          <button
            onClick={() => {
              soundFx.playBeep(880, 0.04);
              setActiveCategory('guards');
            }}
            className={`px-4 py-2 border-r border-[var(--term-border)] flex items-center gap-2 cursor-pointer ${
              activeCategory === 'guards'
                ? 'bg-[var(--term-bg)] text-[var(--term-bright)] font-bold border-b-2 border-b-[var(--term-bright)]'
                : 'text-[var(--term-dim)] hover:text-[var(--term-fg)]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>GUARD RELAYS ({GUARD_RELAYS.length})</span>
          </button>
          <button
            onClick={() => {
              soundFx.playBeep(880, 0.04);
              setActiveCategory('middle');
            }}
            className={`px-4 py-2 border-r border-[var(--term-border)] flex items-center gap-2 cursor-pointer ${
              activeCategory === 'middle'
                ? 'bg-[var(--term-bg)] text-[var(--term-bright)] font-bold border-b-2 border-b-[var(--term-bright)]'
                : 'text-[var(--term-dim)] hover:text-[var(--term-fg)]'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>MIDDLE RELAYS ({MIDDLE_RELAYS.length})</span>
          </button>
        </div>

        {/* Notice */}
        <div className="p-3 bg-black/60 border-b border-[var(--term-border)]/50 text-[11px] text-[var(--term-dim)]">
          {activeCategory === 'exits'
            ? 'Select a designated Exit Relay to override circuit exit node for privacy routing.'
            : 'Tor consensus verified node relays with verified cryptographic keys.'}
        </div>

        {/* Nodes Grid */}
        <div className="flex-1 overflow-auto p-4 space-y-2">
          {getList().map((node) => {
            const isSelectedExit = selectedExit?.fingerprint === node.fingerprint;
            return (
              <div
                key={node.fingerprint}
                className={`border p-3 flex flex-wrap items-center justify-between gap-3 transition-colors ${
                  isSelectedExit
                    ? 'border-[var(--term-bright)] bg-[var(--term-fg)]/10'
                    : 'border-[var(--term-border)] bg-black/40 hover:border-[var(--term-fg)]'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{node.flagEmoji}</span>
                    <span className="text-xs font-bold text-[var(--term-bright)]">{node.nickname}</span>
                    <span className="text-[10px] text-[var(--term-dim)]">({node.country})</span>
                  </div>
                  <div className="text-[11px] text-[var(--term-fg)] font-mono">
                    IP: {node.ip}:{node.port}
                  </div>
                  <div className="text-[10px] text-[var(--term-dim)] font-mono truncate max-w-md">
                    FINGERPRINT: {node.fingerprint}
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {node.flags.map((flag) => (
                      <span
                        key={flag}
                        className="text-[9px] px-1.5 py-0.2 border border-[var(--term-border)] text-[var(--term-dim)]"
                      >
                        {flag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:items-end justify-between gap-2">
                  <div className="text-[11px] text-right font-mono">
                    <div className="text-[var(--term-bright)] font-bold">{node.bandwidthMbps} Mbps</div>
                    <div className="text-[var(--term-dim)] tabular-nums">{node.latencyMs} ms RTT</div>
                    <div className="text-[10px] text-[var(--term-dim)]">Uptime: {node.uptimeDays}d</div>
                  </div>

                  {activeCategory === 'exits' && (
                    <button
                      onClick={() => {
                        soundFx.playBeep(1000, 0.05);
                        onSelectExit(node);
                      }}
                      className={`px-2.5 py-1 text-xs border transition-colors cursor-pointer flex items-center gap-1 ${
                        isSelectedExit
                          ? 'border-[var(--term-bright)] bg-[var(--term-bright)] text-black font-bold'
                          : 'border-[var(--term-border)] hover:border-[var(--term-bright)] hover:bg-[var(--term-fg)]/20'
                      }`}
                    >
                      {isSelectedExit ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>ACTIVE EXIT</span>
                        </>
                      ) : (
                        <span>USE AS EXIT</span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 bg-black/80 border-t border-[var(--term-border)] flex justify-between items-center text-xs">
          <span className="text-[var(--term-dim)]">
            DIRECTORY CONSENSUS: MICRODESCRIPTORS VERIFIED // STRICTNODES ACTIVE
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
