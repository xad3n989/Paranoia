import React, { useState, useEffect } from 'react';
import {
  Download,
  FolderArchive,
  Shield,
  Check,
  Copy,
  Terminal,
  FileCode,
  Cpu,
  Layers,
  HardDrive,
  Info,
  X,
  ExternalLink,
  Zap,
} from 'lucide-react';
import {
  getReleaseManifest,
  ReleaseAssetInfo,
  downloadPrecompiledReleaseZip,
  downloadStandaloneExe,
} from '../utils/releaseBundle';
import { CSHARP_FILES } from '../utils/csharpSources';
import { soundFx } from '../utils/audio';

interface PrecompiledReleaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloaded?: () => void;
}

export const PrecompiledReleaseModal: React.FC<PrecompiledReleaseModalProps> = ({
  isOpen,
  onClose,
  onDownloaded,
}) => {
  const [manifest, setManifest] = useState<ReleaseAssetInfo[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'package' | 'run_guide' | 'sources'>('package');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState(CSHARP_FILES[0]);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getReleaseManifest().then((items) => setManifest(items));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDownloadZip = async () => {
    soundFx.playBeep(980, 0.08);
    setIsDownloading(true);
    setDownloadProgress(0);
    setStatusMessage('Preparing precompiled binaries...');

    try {
      await downloadPrecompiledReleaseZip((pct, msg) => {
        setDownloadProgress(pct);
        setStatusMessage(msg);
        if (pct % 30 === 0) soundFx.playKeyClick();
      });

      soundFx.playConnectedChirp();
      setStatusMessage('Done! Package downloaded to your Downloads folder.');
      onDownloaded?.();
    } catch (err) {
      console.error(err);
      soundFx.playError();
      setStatusMessage('Download failed. Please try direct executable download.');
    } finally {
      setTimeout(() => setIsDownloading(false), 1500);
    }
  };

  const handleDownloadExe = () => {
    soundFx.playBeep(1100, 0.06);
    downloadStandaloneExe();
    soundFx.playConnectedChirp();
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    soundFx.playKeyClick();
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    soundFx.playKeyClick();
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md">
      <div className="bg-[#0b0f14] border border-cyan-500/50 rounded-lg shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden text-neutral-200">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-neutral-900 via-[#101923] to-neutral-900 px-5 py-4 border-b border-cyan-900/50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <Zap className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-cyan-300 font-mono tracking-wide">
                  PARANOIA PRECOMPILED WINDOWS APPLICATION
                </h2>
                <span className="px-2 py-0.5 text-xs font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 rounded">
                  v2.5.0 Standalone (x64)
                </span>
                <span className="px-2 py-0.5 text-xs font-mono bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 rounded">
                  Ready-to-Run • No Setup Required
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-mono mt-0.5">
                Precompiled native Windows PE executable with bundled Tor binaries, torrc &amp; complete Visual Studio .csproj project
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-[#0e1620] px-5 py-2 border-b border-neutral-800 flex items-center gap-2 text-xs font-mono">
          <button
            onClick={() => setActiveTab('package')}
            className={`px-3 py-1.5 rounded border transition-colors flex items-center gap-1.5 ${
              activeTab === 'package'
                ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 font-bold'
                : 'border-transparent text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <FolderArchive className="w-3.5 h-3.5" />
            <span>PRECOMPILED ZIP BUNDLE</span>
          </button>
          <button
            onClick={() => setActiveTab('run_guide')}
            className={`px-3 py-1.5 rounded border transition-colors flex items-center gap-1.5 ${
              activeTab === 'run_guide'
                ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 font-bold'
                : 'border-transparent text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>HOW TO RUN ON WINDOWS</span>
          </button>
          <button
            onClick={() => setActiveTab('sources')}
            className={`px-3 py-1.5 rounded border transition-colors flex items-center gap-1.5 ${
              activeTab === 'sources'
                ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 font-bold'
                : 'border-transparent text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>C# CSPROJ &amp; SOURCE FILES</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto flex-1 font-mono text-xs">
          {activeTab === 'package' && (
            <div className="space-y-5">
              {/* Primary Hero Callout */}
              <div className="p-4 rounded-lg border-2 border-cyan-500/70 bg-gradient-to-r from-cyan-950/40 via-[#0d1c2b] to-cyan-950/40 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
                <div className="space-y-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <h3 className="text-base font-bold text-white tracking-wide">
                      1-CLICK PRECOMPILED PACKAGE DOWNLOAD
                    </h3>
                  </div>
                  <p className="text-neutral-300 text-xs">
                    Contains compiled <strong className="text-cyan-300">Paranoia.exe</strong>, pre-configured <strong className="text-cyan-300">tor/tor.exe</strong>, <strong className="text-cyan-300">torrc</strong>, and Windows elevation scripts. No compilers, Python, or batch wrappers needed.
                  </p>
                  <div className="text-[11px] text-neutral-400 flex items-center gap-3 pt-1">
                    <span>Target: Windows 10 &amp; 11 (64-bit)</span>
                    <span>•</span>
                    <span>Format: ZIP Archive</span>
                    <span>•</span>
                    <span>Status: Pre-compiled &amp; Linked</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto shrink-0">
                  <button
                    onClick={handleDownloadZip}
                    disabled={isDownloading}
                    className="px-5 py-3 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer transition transform active:scale-95 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isDownloading ? 'PACKAGING...' : 'DOWNLOAD 1-CLICK ZIP'}</span>
                  </button>

                  <button
                    onClick={handleDownloadExe}
                    className="px-4 py-3 rounded border border-cyan-500/50 hover:bg-cyan-950/60 text-cyan-300 font-bold flex items-center justify-center gap-2 cursor-pointer transition"
                    title="Directly download standalone Paranoia.exe PE binary"
                  >
                    <HardDrive className="w-4 h-4" />
                    <span>DIRECT PARANOIA.EXE</span>
                  </button>
                </div>
              </div>

              {/* Progress Bar when packaging */}
              {isDownloading && (
                <div className="p-3 bg-black/60 border border-cyan-500/40 rounded space-y-1.5">
                  <div className="flex justify-between text-[11px] text-cyan-300">
                    <span>{statusMessage}</span>
                    <span className="font-bold">{downloadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-800 rounded overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 transition-all duration-200"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Package Contents Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-cyan-300 flex items-center gap-1.5 text-xs">
                    <Layers className="w-4 h-4" />
                    <span>CONTENTS OF PARANOIA-v2.5.0-WinX64-Precompiled.zip</span>
                  </h4>
                  <span className="text-[10px] text-neutral-400">All files ready upon unzipping</span>
                </div>

                <div className="border border-neutral-800 rounded overflow-hidden bg-black/40">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-[#121820] text-neutral-300 border-b border-neutral-800">
                      <tr>
                        <th className="py-2 px-3">File Name / Path</th>
                        <th className="py-2 px-2">Size</th>
                        <th className="py-2 px-3">Description</th>
                        <th className="py-2 px-3">SHA-256 Checksum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60 font-mono">
                      {manifest.map((item) => (
                        <tr key={item.relativePath} className="hover:bg-neutral-800/30">
                          <td className="py-2 px-3 font-bold text-cyan-300 flex items-center gap-1.5">
                            {item.isExecutable ? (
                              <span className="px-1 py-0.2 bg-emerald-950 text-emerald-400 border border-emerald-500/40 rounded text-[9px]">
                                EXE
                              </span>
                            ) : (
                              <span className="px-1 py-0.2 bg-neutral-800 text-neutral-400 rounded text-[9px]">
                                FILE
                              </span>
                            )}
                            <span>{item.relativePath}</span>
                          </td>
                          <td className="py-2 px-2 text-neutral-400">{item.sizeFormatted}</td>
                          <td className="py-2 px-3 text-neutral-300">{item.description}</td>
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-1 text-[10px]">
                              <code className="text-neutral-400 truncate max-w-[140px]" title={item.sha256}>
                                {item.sha256.substring(0, 16)}...
                              </code>
                              {item.sha256 !== 'auto-generated' && item.sha256 !== 'source-files-bundle' && (
                                <button
                                  onClick={() => handleCopyHash(item.sha256)}
                                  className="text-neutral-500 hover:text-cyan-300 p-0.5 cursor-pointer"
                                  title="Copy SHA-256"
                                >
                                  {copiedHash === item.sha256 ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'run_guide' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-[#121820] border border-cyan-500/30 rounded-lg space-y-3">
                <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <span>STEP-BY-STEP: RUNNING PARANOIA.EXE ON WINDOWS</span>
                </h3>

                <div className="space-y-3 text-neutral-300">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-400 text-cyan-300 flex items-center justify-center font-bold text-xs shrink-0">
                      1
                    </span>
                    <div>
                      <strong className="text-white">Download and Extract the ZIP Package</strong>
                      <p className="text-neutral-400 text-[11px] mt-0.5">
                        Download <code className="text-cyan-300">Paranoia-v2.5.0-WinX64-Precompiled.zip</code> and extract its contents to any folder (e.g., <code className="text-neutral-300">C:\Paranoia</code> or Desktop).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-400 text-cyan-300 flex items-center justify-center font-bold text-xs shrink-0">
                      2
                    </span>
                    <div>
                      <strong className="text-white">Launch as Administrator</strong>
                      <p className="text-neutral-400 text-[11px] mt-0.5">
                        Right-click <code className="text-cyan-300">Paranoia.exe</code> and click <strong className="text-white">&quot;Run as administrator&quot;</strong>. Windows requires elevation because Paranoia sets system proxy registries, configures DNS redirection, and activates the Windows Filtering Platform firewall killswitch.
                        <br />
                        <span className="text-neutral-400 italic">Tip: You can also double-click &quot;Run-Paranoia-Admin.cmd&quot; to prompt Windows UAC elevation automatically.</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-400 text-cyan-300 flex items-center justify-center font-bold text-xs shrink-0">
                      3
                    </span>
                    <div>
                      <strong className="text-white">Select Directives via Hotkeys</strong>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        <div className="p-2 bg-black/50 border border-neutral-800 rounded">
                          <span className="text-cyan-400 font-bold">[1]</span> ACTIVATE FULL SYSTEM TOR TUNNEL
                          <div className="text-neutral-500 text-[10px]">Pipes all system &amp; browser traffic through Tor SOCKS5</div>
                        </div>
                        <div className="p-2 bg-black/50 border border-neutral-800 rounded">
                          <span className="text-cyan-400 font-bold">[2]</span> DISENGAGE TOR ROUTING
                          <div className="text-neutral-500 text-[10px]">Restores default DHCP adapter and unhooks proxy</div>
                        </div>
                        <div className="p-2 bg-black/50 border border-neutral-800 rounded">
                          <span className="text-cyan-400 font-bold">[3]</span> ENGAGE ZERO-LEAK KILLSWITCH
                          <div className="text-neutral-500 text-[10px]">Blocks non-Tor outbound packets in Windows Firewall</div>
                        </div>
                        <div className="p-2 bg-black/50 border border-neutral-800 rounded">
                          <span className="text-cyan-400 font-bold">[4]</span> REQUEST NEW ONION CIRCUIT
                          <div className="text-neutral-500 text-[10px]">Transmits SIGNAL NEWNYM to Tor ControlPort</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sources' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {CSHARP_FILES.map((f) => (
                    <button
                      key={f.name}
                      onClick={() => setSelectedSource(f)}
                      className={`px-2.5 py-1 rounded text-xs transition ${
                        selectedSource.name === f.name
                          ? 'bg-cyan-950 border border-cyan-500 text-cyan-300 font-bold'
                          : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handleCopyCode(selectedSource.content)}
                  className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-cyan-300 rounded text-xs flex items-center space-x-1 border border-neutral-700 cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied!' : 'Copy File'}</span>
                </button>
              </div>

              <div className="text-[11px] text-neutral-400">{selectedSource.description}</div>

              <div className="bg-black/80 border border-neutral-800 rounded p-3 overflow-x-auto max-h-[50vh]">
                <pre className="text-cyan-200 text-[11px] font-mono leading-relaxed">
                  {selectedSource.content}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#0e1620] px-5 py-3 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="text-neutral-400 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Architecture: x64 PE32+ • Platform: Windows 10/11 • Digital Failsafe: Netsh AdvFirewall</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadZip}
              className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-black font-bold rounded flex items-center gap-1.5 cursor-pointer transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>DOWNLOAD RELEASE ZIP</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded cursor-pointer transition"
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
