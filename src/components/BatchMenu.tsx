import React from 'react';
import { soundFx } from '../utils/audio';

interface BatchMenuProps {
  onSelectOption: (optionId: number) => void;
  status: 'IDLE' | 'BOOTSTRAPPING' | 'CONNECTED' | 'TERMINATING';
  killswitchArmed: boolean;
  dnsOverTor: boolean;
  currentExitIp?: string;
  isLeakTesting?: boolean;
}

export const BatchMenu: React.FC<BatchMenuProps> = ({
  onSelectOption,
  status,
  killswitchArmed,
  dnsOverTor,
  currentExitIp,
  isLeakTesting,
}) => {
  const isConnected = status === 'CONNECTED';
  const isBooting = status === 'BOOTSTRAPPING';

  const menuItems = [
    {
      id: 1,
      label: 'ACTIVATE FULL SYSTEM TOR TUNNEL',
      desc: 'Hooks Windows SOCKS5 (127.0.0.1:9050) & DNS (5353)',
      status: isConnected ? '[ACTIVE]' : isBooting ? '[BOOTSTRAPPING]' : '[INACTIVE]',
      active: isConnected,
      disabled: isConnected || isBooting,
    },
    {
      id: 2,
      label: 'DISENGAGE TOR SYSTEM ROUTING',
      desc: 'Restores default Windows WinHTTP proxy & DHCP adapter DNS',
      status: !isConnected ? '[OFFLINE]' : '[DISENGAGE]',
      active: false,
      disabled: !isConnected,
    },
    {
      id: 3,
      label: 'REQUEST NEW ONION IDENTITY',
      desc: 'Transmits SIGNAL NEWNYM to Tor Control Port (9051)',
      status: isConnected ? '[READY]' : '[REQUIRES TOR]',
      active: false,
      disabled: !isConnected,
    },
    {
      id: 4,
      label: 'TOGGLE FIREWALL ZERO-LEAK KILLSWITCH',
      desc: 'Enforces Windows Firewall rule: drops non-Tor outbound traffic',
      status: killswitchArmed ? '[KILLSWITCH ARMED]' : '[DISARMED]',
      active: killswitchArmed,
      disabled: false,
    },
    {
      id: 5,
      label: 'AUDIT PUBLIC IP & LEAK PROBE',
      desc: 'Live query to verify exit node IP vs native connection',
      status: isLeakTesting ? '[PROBING...]' : currentExitIp ? `[${currentExitIp}]` : '[TEST IP]',
      active: false,
      disabled: isLeakTesting,
    },
    {
      id: 6,
      label: 'INSPECT ONION RELAY NODES & HOPS',
      desc: 'Directory consensus, Guard, Middle, Exit latency analysis',
      status: '[INSPECT]',
      active: false,
      disabled: false,
    },
    {
      id: 7,
      label: 'CUSTOM WINDOWS INSTALLER & C++ SUITE',
      desc: 'ParanoiaSetup.exe native installer, Inno Setup script & C++ engine (zero batch)',
      status: '[ParanoiaSetup.exe]',
      active: false,
      disabled: false,
    },
    {
      id: 8,
      label: 'VIEW & TUNE TORRC CONFIGURATION',
      desc: 'Inspect SOCKS port, DNSPort, strict country nodes, bridges',
      status: '[CONFIG]',
      active: false,
      disabled: false,
    },
    {
      id: 9,
      label: 'EMERGENCY FLUSH & NETWORK RESET',
      desc: 'Clears all proxy registry keys, netsh winsock reset, ipconfig /flushdns',
      status: '[RESET]',
      active: false,
      disabled: false,
    },
  ];

  return (
    <div className="border border-[var(--term-border)] bg-[var(--term-bg)] p-3 sm:p-4 mb-4 select-none">
      <div className="text-[11px] font-mono text-[var(--term-bright)] flex flex-wrap justify-between items-center border-b border-[var(--term-border)] pb-2 mb-3">
        <span className="font-bold">═════════ [ PARANOIA COMMAND CONSOLE - SELECT DIRECTIVE ] ═════════</span>
        <span className="text-[var(--term-dim)]">CLICK OPTION OR PRESS [1-9]</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-mono">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              soundFx.playBeep(item.id === 4 && !killswitchArmed ? 440 : 880, 0.05);
              onSelectOption(item.id);
            }}
            disabled={item.disabled}
            className={`group text-left p-2.5 border transition-all cursor-pointer flex flex-col justify-between ${
              item.active
                ? 'border-[var(--term-bright)] bg-[var(--term-fg)]/15 text-[var(--term-bright)]'
                : 'border-[var(--term-border)] bg-black/40 text-[var(--term-fg)] hover:border-[var(--term-bright)] hover:bg-[var(--term-fg)]/10'
            } ${item.disabled ? 'opacity-40 cursor-not-allowed hover:border-[var(--term-border)] hover:bg-black/40' : ''}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs sm:text-sm font-bold flex items-center gap-2">
                <span className="px-1.5 py-0.5 border border-[var(--term-border)] bg-black text-[var(--term-accent)] group-hover:bg-[var(--term-fg)] group-hover:text-black">
                  [{item.id}]
                </span>
                <span className="truncate">{item.label}</span>
              </span>
              <span
                className={`text-[10px] sm:text-xs shrink-0 font-mono ${
                  item.active ? 'text-[var(--term-bright)] font-bold' : 'text-[var(--term-dim)]'
                }`}
              >
                {item.status}
              </span>
            </div>
            <div className="text-[10px] text-[var(--term-dim)] group-hover:text-[var(--term-fg)]/70 mt-1 pl-7 truncate">
              {item.desc}
            </div>
          </button>
        ))}
      </div>

      {/* Status Bar */}
      <div className="mt-3 pt-2 border-t border-[var(--term-border)]/50 flex flex-wrap items-center justify-between text-[11px] font-mono gap-2 text-[var(--term-dim)]">
        <div>
          STATUS:{' '}
          <span
            className={`font-bold ${
              isConnected
                ? 'text-[var(--term-bright)]'
                : isBooting
                ? 'text-yellow-400'
                : 'text-zinc-500'
            }`}
          >
            {status}
          </span>{' '}
          | KILLSWITCH:{' '}
          <span className={`font-bold ${killswitchArmed ? 'text-red-400' : 'text-zinc-500'}`}>
            {killswitchArmed ? 'ARMED (NO LEAKS)' : 'DISARMED'}
          </span>{' '}
          | DNS-OVER-TOR:{' '}
          <span className={`font-bold ${dnsOverTor ? 'text-[var(--term-bright)]' : 'text-zinc-500'}`}>
            {dnsOverTor ? '127.0.0.1:5353' : 'NATIVE'}
          </span>
        </div>
        <div className="text-[10px] text-[var(--term-dim)]">
          WIN32_WINNT: 0x0A00 (Win10/11)
        </div>
      </div>
    </div>
  );
};
