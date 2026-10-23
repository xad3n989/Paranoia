import React, { useState } from 'react';
import {
  BATCH_MAIN_SCRIPT,
  TORRC_CONFIG,
  POWERSHELL_ROUTER_SCRIPT,
  KILLSWITCH_STANDALONE,
  EMERGENCY_RESTORE_SCRIPT,
} from '../utils/scriptsGenerator';
import { Copy, Check, Download, X, FileCode, Shield, Terminal } from 'lucide-react';
import { soundFx } from '../utils/audio';

interface ScriptExporterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScriptExporter: React.FC<ScriptExporterProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'batch' | 'torrc' | 'powershell' | 'killswitch' | 'restore'>('batch');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const files = {
    batch: {
      name: 'paranoia.bat',
      code: BATCH_MAIN_SCRIPT,
      desc: 'Complete Windows Batch Engine with Administrator Privilege Escalation & Menu',
    },
    torrc: {
      name: 'torrc',
      code: TORRC_CONFIG,
      desc: 'Tor Daemon configuration file for SOCKS5 9050, DNSPort 5353 & Anti-leak rules',
    },
    powershell: {
      name: 'paranoia.ps1',
      code: POWERSHELL_ROUTER_SCRIPT,
      desc: 'PowerShell system network adapter and registry proxy controller',
    },
    killswitch: {
      name: 'killswitch.bat',
      code: KILLSWITCH_STANDALONE,
      desc: 'Zero-leak Windows Firewall blocker script using netsh advfirewall',
    },
    restore: {
      name: 'emergency_restore.bat',
      code: EMERGENCY_RESTORE_SCRIPT,
      desc: 'Reset all Windows proxy and firewall modifications back to default DHCP',
    },
  };

  const currentFile = files[activeTab];

  const handleCopy = () => {
    soundFx.playBeep(1200, 0.05);
    navigator.clipboard.writeText(currentFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    soundFx.playBeep(880, 0.08);
    const blob = new Blob([currentFile.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = currentFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    soundFx.playConnectedChirp();
    // Download primary batch file and torrc
    Object.values(files).forEach((f) => {
      const blob = new Blob([f.code], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = f.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 font-mono">
      <div className="w-full max-w-4xl border border-[var(--term-border)] bg-[var(--term-bg)] shadow-2xl flex flex-col max-h-[92vh]">
        {/* Title Bar */}
        <div className="bg-black border-b border-[var(--term-border)] px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--term-bright)]">
            <Terminal className="w-4 h-4" />
            <span>EXPORT WINDOWS PRODUCTION BATCH SUITE // WIN32 / x64</span>
          </div>
          <button
            onClick={() => {
              soundFx.playBeep(440, 0.05);
              onClose();
            }}
            className="text-[var(--term-dim)] hover:text-[var(--term-bright)] px-2 py-0.5 border border-transparent hover:border-[var(--term-border)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Instructions banner */}
        <div className="p-3 bg-black/60 border-b border-[var(--term-border)]/50 text-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[var(--term-dim)]">
            <Shield className="w-4 h-4 text-[var(--term-bright)]" />
            <span>
              Save files into folder (e.g. <code className="text-[var(--term-bright)]">C:\PARANOIA\</code>) and run{' '}
              <code className="text-[var(--term-bright)]">paranoia.bat</code> as Administrator.
            </span>
          </div>
          <button
            onClick={handleDownloadAll}
            className="px-2.5 py-1 text-xs border border-[var(--term-bright)] bg-[var(--term-dim)]/20 hover:bg-[var(--term-fg)] hover:text-black font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>DOWNLOAD ALL 5 SCRIPTS</span>
          </button>
        </div>

        {/* File Tabs */}
        <div className="flex overflow-x-auto border-b border-[var(--term-border)] bg-black/40 text-xs">
          {(Object.keys(files) as Array<keyof typeof files>).map((tabKey) => {
            const f = files[tabKey];
            const isActive = activeTab === tabKey;
            return (
              <button
                key={tabKey}
                onClick={() => {
                  soundFx.playBeep(900, 0.04);
                  setActiveTab(tabKey);
                }}
                className={`px-3 py-2 border-r border-[var(--term-border)] flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-[var(--term-bg)] text-[var(--term-bright)] font-bold border-b-2 border-b-[var(--term-bright)]'
                    : 'text-[var(--term-dim)] hover:text-[var(--term-fg)]'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>{f.name}</span>
              </button>
            );
          })}
        </div>

        {/* Content Viewer Header */}
        <div className="px-4 py-2 border-b border-[var(--term-border)]/40 flex items-center justify-between text-xs bg-black/30">
          <span className="text-[var(--term-dim)] truncate">{currentFile.desc}</span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 border border-[var(--term-border)] hover:border-[var(--term-bright)] hover:bg-[var(--term-fg)]/10 text-xs flex items-center gap-1 cursor-pointer transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'COPIED!' : 'COPY CODE'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="px-2.5 py-1 border border-[var(--term-bright)] bg-[var(--term-fg)] text-black font-bold text-xs flex items-center gap-1 hover:bg-[var(--term-accent)] cursor-pointer transition-colors"
            >
              <Download className="w-3 h-3" />
              <span>DOWNLOAD {currentFile.name}</span>
            </button>
          </div>
        </div>

        {/* Code Container */}
        <div className="flex-1 overflow-auto p-4 bg-black font-mono text-xs text-[var(--term-fg)] select-text">
          <pre className="whitespace-pre font-mono leading-relaxed">{currentFile.code}</pre>
        </div>

        {/* Footer */}
        <div className="p-3 bg-black/80 border-t border-[var(--term-border)] text-[11px] text-[var(--term-dim)] flex justify-between items-center">
          <span>PARANOIA BATCH UTILITY // ZERO EXTERNAL DEPENDENCY REQUIRED FOR SCRIPT</span>
          <button
            onClick={onClose}
            className="px-3 py-1 border border-[var(--term-border)] hover:text-[var(--term-bright)] cursor-pointer"
          >
            [CLOSE ESC]
          </button>
        </div>
      </div>
    </div>
  );
};
