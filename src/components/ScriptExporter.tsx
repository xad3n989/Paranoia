import React, { useState } from 'react';
import JSZip from 'jszip';
import {
  BATCH_MAIN_SCRIPT,
  TORRC_CONFIG,
  POWERSHELL_ROUTER_SCRIPT,
  KILLSWITCH_STANDALONE,
  EMERGENCY_RESTORE_SCRIPT,
  CPP_NATIVE_ENGINE,
  CPP_BUILD_BAT,
  CPP_INSTALLER_CODE,
  INNO_SETUP_CODE,
} from '../utils/scriptsGenerator';
import { Copy, Check, Download, X, FileCode, Shield, Terminal, Cpu } from 'lucide-react';
import { soundFx } from '../utils/audio';

interface ScriptExporterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScriptExporter: React.FC<ScriptExporterProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'installer' | 'iss' | 'cpp' | 'buildbat' | 'batch' | 'torrc' | 'powershell' | 'killswitch' | 'restore'>('installer');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const files = {
    installer: {
      name: 'installer.cpp',
      code: CPP_INSTALLER_CODE,
      desc: 'Custom Native C++ Windows Installer (ParanoiaSetup.exe)',
    },
    iss: {
      name: 'paranoia.iss',
      code: INNO_SETUP_CODE,
      desc: 'Inno Setup Script (Compiles ParanoiaSetup-v2.5.0-x64.exe installer)',
    },
    cpp: {
      name: 'paranoia.cpp',
      code: CPP_NATIVE_ENGINE,
      desc: 'Native Win32 C++ Tor System Router (WinINet, Winsock2, Windows Firewall API)',
    },
    buildbat: {
      name: 'build.bat',
      code: CPP_BUILD_BAT,
      desc: 'Automated 1-click build script for MSVC (cl.exe) and MinGW (g++)',
    },
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

  const [downloadingZip, setDownloadingZip] = useState(false);

  const handleDownloadAll = async () => {
    try {
      setDownloadingZip(true);
      soundFx.playConnectedChirp();
      const zip = new JSZip();
      const folder = zip.folder('paranoia-v2.5.0-windows-x64');
      if (folder) {
        folder.file('setup.bat', `@echo off\ntitle PARANOIA Installer\ncall paranoia.bat\n`);
        folder.file('paranoia.cpp', CPP_NATIVE_ENGINE);
        folder.file('build.bat', CPP_BUILD_BAT);
        folder.file('paranoia.bat', BATCH_MAIN_SCRIPT);
        folder.file('torrc', TORRC_CONFIG);
        folder.file('killswitch.bat', KILLSWITCH_STANDALONE);
        folder.file('paranoia.ps1', POWERSHELL_ROUTER_SCRIPT);
        folder.file('emergency_restore.bat', EMERGENCY_RESTORE_SCRIPT);
        folder.file('README.txt', 'PARANOIA v2.5.0 - WINDOWS TOR TRANSPARENT SYSTEM ROUTER\nCompile native C++ with build.bat or run setup.bat as Administrator.\n');
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'paranoia-v2.5.0-windows-x64.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      soundFx.playError();
    } finally {
      setTimeout(() => setDownloadingZip(false), 800);
    }
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
