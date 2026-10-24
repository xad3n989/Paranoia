import React, { useState, useEffect } from 'react';
import { Shield, Folder, HardDrive, Check, Terminal, Download, ArrowRight, ArrowLeft, X, Lock } from 'lucide-react';
import { soundFx } from '../utils/audio';

interface WindowsInstallerWizardProps {
  onInstallComplete: () => void;
  onCancel: () => void;
}

type WizardStep = 'welcome' | 'license' | 'directory' | 'components' | 'ready' | 'installing' | 'completed';

export const WindowsInstallerWizard: React.FC<WindowsInstallerWizardProps> = ({
  onInstallComplete,
  onCancel,
}) => {
  const [step, setStep] = useState<WizardStep>('welcome');
  const [acceptedLicense, setAcceptedLicense] = useState(true);
  const [installPath, setInstallPath] = useState('C:\\Program Files\\Paranoia');
  const [progress, setProgress] = useState(0);
  const [statusLog, setStatusLog] = useState('Initializing installer payload...');
  const [launchOnFinish, setLaunchOnFinish] = useState(true);

  // Components Checklist
  const [components, setComponents] = useState({
    nativeExe: true,
    torDaemon: true,
    killswitchDriver: true,
    dnsOverTor: true,
    desktopShortcut: true,
    startMenu: true,
    registryUninstall: true,
  });

  // Animated installation progress
  useEffect(() => {
    if (step !== 'installing') return;

    setProgress(0);
    const steps = [
      { pct: 15, msg: 'Creating directory structure: ' + installPath + '...' },
      { pct: 35, msg: 'Extracting paranoia.exe (Native C++ PE64 binary)...' },
      { pct: 55, msg: 'Deploying Tor Expert Bundle runtime and torrc configuration...' },
      { pct: 75, msg: 'Configuring Windows Filtering Platform and netsh firewall rules...' },
      { pct: 90, msg: 'Registering Windows Uninstall key: HKLM\\Software\\...\\Uninstall\\Paranoia...' },
      { pct: 100, msg: 'Generating Desktop and Start Menu shortcuts...' },
    ];

    steps.forEach((s, idx) => {
      setTimeout(() => {
        soundFx.playKeyClick();
        setProgress(s.pct);
        setStatusLog(s.msg);
        if (s.pct === 100) {
          setTimeout(() => {
            soundFx.playConnectedChirp();
            setStep('completed');
          }, 600);
        }
      }, (idx + 1) * 450);
    });
  }, [step, installPath]);

  const handleNext = () => {
    soundFx.playBeep(880, 0.04);
    switch (step) {
      case 'welcome':
        setStep('license');
        break;
      case 'license':
        setStep('directory');
        break;
      case 'directory':
        setStep('components');
        break;
      case 'components':
        setStep('ready');
        break;
      case 'ready':
        setStep('installing');
        break;
      case 'completed':
        if (launchOnFinish) {
          onInstallComplete();
        } else {
          onCancel();
        }
        break;
    }
  };

  const handleBack = () => {
    soundFx.playBeep(600, 0.04);
    switch (step) {
      case 'license':
        setStep('welcome');
        break;
      case 'directory':
        setStep('license');
        break;
      case 'components':
        setStep('directory');
        break;
      case 'ready':
        setStep('components');
        break;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-2 sm:p-4 font-sans select-none">
      {/* Authentic Windows Setup Dialog Box */}
      <div className="w-full max-w-[640px] bg-[#1e1e1e] text-[#cccccc] border border-[#3c3c3c] shadow-2xl flex flex-col rounded-sm overflow-hidden text-xs">
        {/* Windows Dialog Title Bar */}
        <div className="bg-[#2d2d2d] border-b border-[#3c3c3c] px-3 py-2 flex items-center justify-between text-xs text-white">
          <div className="flex items-center gap-2 font-medium">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>PARANOIA Setup - Windows Tor System Router v2.5.0</span>
          </div>
          <button
            onClick={onCancel}
            className="hover:bg-red-600 px-2 py-0.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Wizard Main Body */}
        <div className="flex flex-1 min-h-[380px]">
          {/* Left Decorative Branding Strip */}
          <div className="w-[180px] bg-[#141414] border-r border-[#333333] p-4 hidden sm:flex flex-col justify-between">
            <div className="space-y-3">
              <div className="p-2.5 bg-black/50 border border-emerald-500/40 text-emerald-400 font-mono text-[10px] space-y-1">
                <div className="font-bold">PARANOIA</div>
                <div className="text-[9px] text-zinc-400">WIN32 x64 NATIVE</div>
                <div className="text-[9px] text-emerald-500/80">BUILD: v2.5.0</div>
              </div>
              <div className="text-[10px] text-zinc-400 space-y-1 font-mono">
                <div>• Zero HTML Runtime</div>
                <div>• Pure C++ Binary</div>
                <div>• WinINet Interceptor</div>
                <div>• WFP Killswitch</div>
              </div>
            </div>

            <div className="text-[9px] text-zinc-500 font-mono">
              Microsoft Windows 10/11 Architecture (x64)
            </div>
          </div>

          {/* Right Main Wizard Form */}
          <div className="flex-1 p-5 flex flex-col justify-between bg-[#1e1e1e]">
            {/* STEP 1: WELCOME */}
            {step === 'welcome' && (
              <div className="space-y-4">
                <div className="border-b border-[#333333] pb-3">
                  <h2 className="text-base font-bold text-white mb-1">Welcome to the PARANOIA Setup Wizard</h2>
                  <p className="text-zinc-400 text-xs">
                    This wizard will guide you through the installation of the PARANOIA Windows Tor Transparent Router on your computer.
                  </p>
                </div>
                <div className="space-y-2.5 text-zinc-300 text-xs leading-relaxed">
                  <p>
                    PARANOIA installs a dedicated Windows system router that pipes all system traffic (browsers, command-line utilities, background services) through the Tor Onion Network.
                  </p>
                  <p>
                    Features included in this build:
                  </p>
                  <ul className="list-disc list-inside text-zinc-400 space-y-1 pl-1">
                    <li>Native C++ Win32 Executable (<code className="text-emerald-400">paranoia.exe</code>)</li>
                    <li>Automatic DNS-over-Tor port 5353 redirection</li>
                    <li>Windows Firewall zero-leak failsafe killswitch</li>
                    <li>Real-time connection throughput & latency telemetry</li>
                  </ul>
                  <p className="text-zinc-400 pt-2">
                    Click <strong>Next</strong> to continue, or <strong>Cancel</strong> to exit Setup.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 2: LICENSE */}
            {step === 'license' && (
              <div className="space-y-3">
                <div className="border-b border-[#333333] pb-2">
                  <h2 className="text-sm font-bold text-white">License Agreement & Security Notice</h2>
                  <p className="text-zinc-400 text-[11px]">Please read the following license agreement carefully before continuing.</p>
                </div>
                <div className="h-36 overflow-y-auto p-2.5 bg-black/60 border border-[#333333] font-mono text-[10px] text-zinc-300 space-y-2 leading-relaxed select-text">
                  <p className="font-bold text-emerald-400">MIT LICENSE - PARANOIA SECURITY GROUP</p>
                  <p>
                    Permission is hereby granted, free of charge, to any person obtaining a copy of this software to route network traffic securely through Tor.
                  </p>
                  <p>
                    PRIVACY NOTICE: PARANOIA modifies Windows registry proxy settings (HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings) and configures outbound Windows Firewall rules to guarantee zero unencrypted packets bypass the Tor SOCKS5 proxy.
                  </p>
                  <p>
                    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED.
                  </p>
                </div>
                <div className="space-y-1.5 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="radio"
                      name="license"
                      checked={acceptedLicense}
                      onChange={() => setAcceptedLicense(true)}
                    />
                    <span>I accept the agreement</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-400">
                    <input
                      type="radio"
                      name="license"
                      checked={!acceptedLicense}
                      onChange={() => setAcceptedLicense(false)}
                    />
                    <span>I do not accept the agreement</span>
                  </label>
                </div>
              </div>
            )}

            {/* STEP 3: DIRECTORY */}
            {step === 'directory' && (
              <div className="space-y-3">
                <div className="border-b border-[#333333] pb-2">
                  <h2 className="text-sm font-bold text-white">Select Destination Location</h2>
                  <p className="text-zinc-400 text-[11px]">Where should PARANOIA be installed?</p>
                </div>
                <p className="text-zinc-300 text-xs">
                  Setup will install PARANOIA into the following folder:
                </p>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center gap-2 bg-black border border-[#3c3c3c] px-3 py-1.5">
                    <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                    <input
                      type="text"
                      value={installPath}
                      onChange={(e) => setInstallPath(e.target.value)}
                      className="bg-transparent border-none text-white outline-none w-full font-mono text-xs"
                    />
                  </div>
                  <button
                    onClick={() => soundFx.playKeyClick()}
                    className="px-3 py-1 bg-[#2d2d2d] border border-[#444444] hover:bg-[#3d3d3d] text-white cursor-pointer"
                  >
                    Browse...
                  </button>
                </div>
                <div className="p-2.5 bg-black/40 border border-[#333333] flex items-center gap-2 text-[11px] text-zinc-400">
                  <HardDrive className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>At least 35.4 MB of free disk space is required on this drive.</span>
                </div>
              </div>
            )}

            {/* STEP 4: COMPONENTS */}
            {step === 'components' && (
              <div className="space-y-3">
                <div className="border-b border-[#333333] pb-2">
                  <h2 className="text-sm font-bold text-white">Select Installation Components</h2>
                  <p className="text-zinc-400 text-[11px]">Choose which features you want to install.</p>
                </div>
                <div className="space-y-2 p-3 bg-black/50 border border-[#333333]">
                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={components.nativeExe}
                      onChange={(e) => setComponents({ ...components, nativeExe: e.target.checked })}
                    />
                    <span className="font-semibold text-white">PARANOIA Native C++ Win32 Core (paranoia.exe)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={components.torDaemon}
                      onChange={(e) => setComponents({ ...components, torDaemon: e.target.checked })}
                    />
                    <span className="text-zinc-300">Tor Expert Bundle 13.5.5 Background Daemon (tor.exe)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={components.killswitchDriver}
                      onChange={(e) => setComponents({ ...components, killswitchDriver: e.target.checked })}
                    />
                    <span className="text-zinc-300">Windows Firewall Zero-Leak Killswitch Filter</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={components.dnsOverTor}
                      onChange={(e) => setComponents({ ...components, dnsOverTor: e.target.checked })}
                    />
                    <span className="text-zinc-300">DNS-over-Tor (Port 5353 Localhost Hook)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={components.desktopShortcut}
                      onChange={(e) => setComponents({ ...components, desktopShortcut: e.target.checked })}
                    />
                    <span className="text-zinc-300">Create Desktop and Start Menu Shortcuts</span>
                  </label>
                </div>
              </div>
            )}

            {/* STEP 5: READY */}
            {step === 'ready' && (
              <div className="space-y-3">
                <div className="border-b border-[#333333] pb-2">
                  <h2 className="text-sm font-bold text-white">Ready to Install</h2>
                  <p className="text-zinc-400 text-[11px]">Setup is now ready to begin installing PARANOIA on your computer.</p>
                </div>
                <div className="p-3 bg-black/60 border border-[#333333] space-y-2 text-xs">
                  <div>
                    <span className="text-zinc-400">Destination folder:</span>
                    <div className="font-mono text-emerald-400 text-[11px]">{installPath}</div>
                  </div>
                  <div>
                    <span className="text-zinc-400">Routing type:</span>
                    <div className="text-white text-[11px]">Transparent System SOCKS5 (127.0.0.1:9050)</div>
                  </div>
                  <div>
                    <span className="text-zinc-400">Firewall policy:</span>
                    <div className="text-white text-[11px]">Hardware Killswitch Enforced (netsh advfirewall)</div>
                  </div>
                </div>
                <p className="text-zinc-400 text-xs">
                  Click <strong>Install</strong> to continue with the installation.
                </p>
              </div>
            )}

            {/* STEP 6: INSTALLING */}
            {step === 'installing' && (
              <div className="space-y-4 py-6">
                <div>
                  <h2 className="text-sm font-bold text-white mb-1">Installing PARANOIA...</h2>
                  <p className="text-zinc-400 text-xs">Please wait while Setup installs PARANOIA on your computer.</p>
                </div>

                <div className="space-y-2">
                  <div className="text-[11px] font-mono text-emerald-400 truncate">{statusLog}</div>
                  {/* Windows Style Progress Bar */}
                  <div className="w-full h-5 bg-black border border-[#333333] overflow-hidden p-0.5">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                    <span>STATUS: EXTRACTING PE64 BINARY</span>
                    <span>{progress}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 7: COMPLETED */}
            {step === 'completed' && (
              <div className="space-y-4">
                <div className="border-b border-[#333333] pb-3">
                  <h2 className="text-base font-bold text-white mb-1">Completing the PARANOIA Setup Wizard</h2>
                  <p className="text-zinc-400 text-xs">
                    Setup has finished installing PARANOIA on your computer. The application may be launched by selecting the installed shortcuts.
                  </p>
                </div>

                <div className="p-3 bg-black/60 border border-emerald-500/40 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-white">
                    <input
                      type="checkbox"
                      checked={launchOnFinish}
                      onChange={(e) => setLaunchOnFinish(e.target.checked)}
                    />
                    <span>Launch PARANOIA Tor Router now (paranoia.exe)</span>
                  </label>
                </div>

                <p className="text-zinc-400 text-xs">
                  Click <strong>Finish</strong> to exit Setup.
                </p>
              </div>
            )}

            {/* Bottom Controls Bar */}
            <div className="pt-4 border-t border-[#333333] flex items-center justify-between">
              <div className="text-[10px] text-zinc-500 font-mono">
                {step !== 'installing' && step !== 'completed' && <span>Step {step === 'welcome' ? '1' : step === 'license' ? '2' : step === 'directory' ? '3' : step === 'components' ? '4' : '5'} of 5</span>}
              </div>

              <div className="flex items-center gap-2">
                {step !== 'welcome' && step !== 'installing' && step !== 'completed' && (
                  <button
                    onClick={handleBack}
                    className="px-4 py-1.5 bg-[#2d2d2d] border border-[#444444] hover:bg-[#3d3d3d] text-white text-xs cursor-pointer flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Back</span>
                  </button>
                )}

                {step !== 'installing' && (
                  <button
                    onClick={handleNext}
                    disabled={step === 'license' && !acceptedLicense}
                    className="px-5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs border border-emerald-400 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <span>
                      {step === 'completed'
                        ? 'Finish'
                        : step === 'ready'
                        ? 'Install'
                        : step === 'license'
                        ? 'I Agree'
                        : 'Next'}
                    </span>
                    {step !== 'completed' && <ArrowRight className="w-3 h-3" />}
                  </button>
                )}

                {step !== 'completed' && (
                  <button
                    onClick={onCancel}
                    disabled={step === 'installing'}
                    className="px-4 py-1.5 bg-[#2d2d2d] border border-[#444444] hover:bg-[#3d3d3d] text-zinc-400 hover:text-white text-xs cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
