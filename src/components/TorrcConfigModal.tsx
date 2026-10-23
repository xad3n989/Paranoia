import React, { useState, useEffect } from 'react';
import { X, Globe2, ShieldAlert, Check, Plus, Trash2, Cpu } from 'lucide-react';
import { soundFx } from '../utils/audio';

export interface ExitNodePreference {
  countryCodes: string[]; // e.g. ['ch', 'is', 'nl', 'se']
  specificNodeIds: string[]; // e.g. fingerprints
  strictNodes: boolean; // if true, Tor will ONLY connect if these nodes exist
  excludeExitNodes: string[]; // e.g. ['us', 'gb', 'ca', 'au', 'nz']
  socksPort: number;
  dnsPort: number;
  controlPort: number;
}

interface TorrcConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ExitNodePreference;
  onSave: (newConfig: ExitNodePreference) => void;
}

const PRESET_JURISDICTIONS = [
  {
    name: 'Nordic / Non-Five-Eyes Haven',
    countries: ['is', 'no', 'se', 'fi'],
    desc: 'Strong statutory privacy laws in Iceland, Norway, Sweden & Finland',
  },
  {
    name: 'Swiss & Alpine Confidentiality',
    countries: ['ch', 'at'],
    desc: 'Switzerland & Austria bank-grade constitutional privacy protections',
  },
  {
    name: 'Panama & Offshore Enclave',
    countries: ['pa', 'cr', 'ro'],
    desc: 'Offshore jurisdictions outside Western data retention mandates',
  },
  {
    name: 'European Freedom Corridors',
    countries: ['nl', 'de', 'ee'],
    desc: 'High-bandwidth transit hubs with Dutch & German gigabit fibers',
  },
];

export const TorrcConfigModal: React.FC<TorrcConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
}) => {
  const [localConfig, setLocalConfig] = useState<ExitNodePreference>(config);
  const [newCountryInput, setNewCountryInput] = useState('');
  const [newNodeInput, setNewNodeInput] = useState('');
  const [saveFeedback, setSaveFeedback] = useState(false);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  if (!isOpen) return null;

  const handleAddCountry = () => {
    const raw = newCountryInput.trim().toLowerCase().replace(/[{}]/g, '');
    if (!raw) return;
    if (!localConfig.countryCodes.includes(raw)) {
      soundFx.playBeep(980, 0.04);
      setLocalConfig((prev) => ({
        ...prev,
        countryCodes: [...prev.countryCodes, raw],
      }));
    }
    setNewCountryInput('');
  };

  const handleRemoveCountry = (code: string) => {
    soundFx.playBeep(400, 0.04);
    setLocalConfig((prev) => ({
      ...prev,
      countryCodes: prev.countryCodes.filter((c) => c !== code),
    }));
  };

  const handleAddNode = () => {
    const raw = newNodeInput.trim().toUpperCase();
    if (!raw) return;
    if (!localConfig.specificNodeIds.includes(raw)) {
      soundFx.playBeep(980, 0.04);
      setLocalConfig((prev) => ({
        ...prev,
        specificNodeIds: [...prev.specificNodeIds, raw],
      }));
    }
    setNewNodeInput('');
  };

  const handleRemoveNode = (id: string) => {
    soundFx.playBeep(400, 0.04);
    setLocalConfig((prev) => ({
      ...prev,
      specificNodeIds: prev.specificNodeIds.filter((n) => n !== id),
    }));
  };

  const applyPreset = (countries: string[]) => {
    soundFx.playBeep(1100, 0.05);
    setLocalConfig((prev) => ({
      ...prev,
      countryCodes: Array.from(new Set([...prev.countryCodes, ...countries])),
    }));
  };

  const handleSave = () => {
    soundFx.playConnectedChirp();
    onSave(localConfig);
    setSaveFeedback(true);
    setTimeout(() => {
      setSaveFeedback(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 font-mono">
      <div className="w-full max-w-3xl border border-[var(--term-border)] bg-[var(--term-bg)] shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-black border-b border-[var(--term-border)] px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--term-bright)]">
            <Globe2 className="w-4 h-4" />
            <span>CONFIGURE PREFERRED & MANDATORY TOR EXIT NODES (TORRC)</span>
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

        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
          {/* Strict Nodes Toggle */}
          <div className="border border-[var(--term-border)] p-3 bg-black/50 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-[var(--term-bright)]">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>MANDATORY STRICT NODES (StrictNodes 1)</span>
              </div>
              <button
                onClick={() => {
                  soundFx.playBeep(localConfig.strictNodes ? 500 : 900, 0.05);
                  setLocalConfig((prev) => ({ ...prev, strictNodes: !prev.strictNodes }));
                }}
                className={`px-3 py-1 border font-bold cursor-pointer transition-colors ${
                  localConfig.strictNodes
                    ? 'border-red-500 bg-red-950/60 text-red-300'
                    : 'border-[var(--term-border)] bg-black/40 text-[var(--term-dim)] hover:text-[var(--term-fg)]'
                }`}
              >
                {localConfig.strictNodes ? '[MANDATORY / STRICT ON]' : '[PREFERRED / ADVISORY]'}
              </button>
            </div>
            <p className="text-[11px] text-[var(--term-dim)] leading-relaxed">
              When <strong className="text-[var(--term-fg)]">MANDATORY (StrictNodes 1)</strong> is enabled, Tor will
              strictly REFUSE to connect or build circuits unless an exit node from your allowed list is available. When
              Advisory, Tor prioritizes your choices while falling back to trusted relays.
            </p>
          </div>

          {/* Quick Presets */}
          <div>
            <div className="text-[11px] font-bold text-[var(--term-bright)] mb-2 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              <span>PRE-CONFIGURED PRIVACY JURISDICTIONS</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_JURISDICTIONS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset.countries)}
                  className="text-left p-2 border border-[var(--term-border)] bg-black/30 hover:border-[var(--term-bright)] hover:bg-[var(--term-fg)]/10 cursor-pointer transition-all"
                >
                  <div className="font-bold text-[var(--term-bright)] text-xs flex items-center justify-between">
                    <span>{preset.name}</span>
                    <span className="text-[10px] text-[var(--term-dim)]">{preset.countries.map((c) => `{${c}}`).join(' ')}</span>
                  </div>
                  <div className="text-[10px] text-[var(--term-dim)] mt-1">{preset.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Preferred Exit Countries */}
          <div className="border border-[var(--term-border)] p-3 bg-black/40">
            <div className="font-bold text-[var(--term-bright)] mb-2 flex items-center justify-between">
              <span>ALLOWED EXIT COUNTRIES (ExitNodes &#123;cc&#125;)</span>
              <span className="text-[10px] text-[var(--term-dim)]">{localConfig.countryCodes.length} CONFIGURED</span>
            </div>

            {/* Country tags */}
            <div className="flex flex-wrap gap-1.5 mb-3 min-h-[32px] p-2 bg-black/70 border border-[var(--term-border)]/50">
              {localConfig.countryCodes.length === 0 ? (
                <span className="text-[var(--term-dim)] text-[11px] italic">
                  No country restrictions (Tor will automatically balance across all global exit nodes).
                </span>
              ) : (
                localConfig.countryCodes.map((code) => (
                  <span
                    key={code}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[var(--term-dim)]/20 border border-[var(--term-border)] text-[var(--term-bright)] text-xs"
                  >
                    <span>&#123;{code.toUpperCase()}&#125;</span>
                    <button
                      onClick={() => handleRemoveCountry(code)}
                      className="hover:text-red-400 cursor-pointer"
                      title="Remove"
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Add Country Input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Country 2-letter ISO (e.g. ch, is, nl, se, no, pa)"
                value={newCountryInput}
                onChange={(e) => setNewCountryInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCountry()}
                maxLength={4}
                className="flex-1 bg-black border border-[var(--term-border)] px-2.5 py-1 text-xs text-[var(--term-bright)] outline-none uppercase font-mono"
              />
              <button
                onClick={handleAddCountry}
                className="px-3 py-1 border border-[var(--term-border)] hover:border-[var(--term-bright)] hover:bg-[var(--term-fg)]/20 text-xs font-bold cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>ADD COUNTRY</span>
              </button>
            </div>
          </div>

          {/* Specific Node Fingerprints / IDs */}
          <div className="border border-[var(--term-border)] p-3 bg-black/40">
            <div className="font-bold text-[var(--term-bright)] mb-2 flex items-center justify-between">
              <span>MANDATORY SPECIFIC NODE FINGERPRINTS ($HEX)</span>
              <span className="text-[10px] text-[var(--term-dim)]">{localConfig.specificNodeIds.length} PINNED</span>
            </div>

            <div className="space-y-1.5 mb-3 max-h-28 overflow-y-auto">
              {localConfig.specificNodeIds.length === 0 ? (
                <div className="text-[11px] text-[var(--term-dim)] italic p-2 bg-black/70 border border-[var(--term-border)]/50">
                  No specific relay fingerprints pinned.
                </div>
              ) : (
                localConfig.specificNodeIds.map((id) => (
                  <div
                    key={id}
                    className="flex items-center justify-between p-1.5 bg-black/80 border border-[var(--term-border)]/50 text-[11px]"
                  >
                    <span className="text-[var(--term-bright)] font-mono truncate">${id}</span>
                    <button
                      onClick={() => handleRemoveNode(id)}
                      className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                      title="Remove"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="40-hex fingerprint (e.g. 8490AF31B8942187CB14981EAA2400918734BC19)"
                value={newNodeInput}
                onChange={(e) => setNewNodeInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddNode()}
                className="flex-1 bg-black border border-[var(--term-border)] px-2.5 py-1 text-xs text-[var(--term-bright)] outline-none uppercase font-mono"
              />
              <button
                onClick={handleAddNode}
                className="px-3 py-1 border border-[var(--term-border)] hover:border-[var(--term-bright)] hover:bg-[var(--term-fg)]/20 text-xs font-bold cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>PIN NODE</span>
              </button>
            </div>
          </div>

          {/* Generated torrc preview line */}
          <div className="p-2.5 bg-black border border-[var(--term-border)] text-[11px] font-mono text-[var(--term-dim)]">
            <span className="text-[var(--term-fg)]">Active Torrc Directive Preview:</span>
            <div className="text-[var(--term-bright)] mt-1 whitespace-pre-wrap">
              {localConfig.countryCodes.length > 0 || localConfig.specificNodeIds.length > 0
                ? `ExitNodes ${[
                    ...localConfig.countryCodes.map((c) => `{${c}}`),
                    ...localConfig.specificNodeIds.map((n) => `$${n}`),
                  ].join(',')}\nStrictNodes ${localConfig.strictNodes ? '1' : '0'}`
                : '# No ExitNodes defined. Default randomized consensus in effect.'}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-black/90 border-t border-[var(--term-border)] flex items-center justify-between text-xs">
          <span className="text-[var(--term-dim)]">
            {saveFeedback ? 'CONFIGURATION APPLIED AND SAVED TO STORAGE' : 'CHANGES REQUIRE CIRCUIT REBUILD'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 border border-[var(--term-border)] text-[var(--term-dim)] hover:text-[var(--term-bright)] cursor-pointer"
            >
              CANCEL
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 border border-[var(--term-bright)] bg-[var(--term-fg)] text-black font-bold flex items-center gap-1.5 cursor-pointer hover:bg-[var(--term-accent)] transition-colors"
            >
              {saveFeedback ? <Check className="w-3.5 h-3.5" /> : null}
              <span>SAVE & APPLY EXIT PREFERENCES</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
