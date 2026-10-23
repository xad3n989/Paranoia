import React, { useState, useRef, useEffect } from 'react';
import { soundFx } from '../utils/audio';

export interface ConsoleLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'notice' | 'success' | 'warning';
  text: string;
  timestamp?: string;
}

interface TerminalPromptProps {
  lines: ConsoleLine[];
  onCommand: (cmd: string) => void;
  onClear: () => void;
}

export const TerminalPrompt: React.FC<TerminalPromptProps> = ({
  lines,
  onCommand,
  onClear: _onClear,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [commandHistory, setCommandHistory] = useState<string[]>([
    'paranoia --start',
    'status',
    'checkip',
  ]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll on new output
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    soundFx.playKeyClick();

    if (e.key === 'Enter') {
      const trimmed = inputVal.trim();
      if (trimmed) {
        setCommandHistory((prev) => [...prev, trimmed]);
        setHistoryIndex(-1);
        onCommand(trimmed);
      } else {
        onCommand('');
      }
      setInputVal('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setInputVal(commandHistory[nextIndex]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= commandHistory.length) {
        setHistoryIndex(-1);
        setInputVal('');
      } else {
        setHistoryIndex(nextIndex);
        setInputVal(commandHistory[nextIndex]);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Auto-complete hints
      const available = [
        'help',
        'start',
        'stop',
        'newnym',
        'killswitch',
        'checkip',
        'leaktest',
        'nodes',
        'export',
        'torrc',
        'flush',
        'cls',
        'clear',
        'color 0A',
        'color 0F',
        'color 0C',
        'color 0E',
        'color 1F',
        'matrix',
        'sound on',
        'sound off',
      ];
      const match = available.find((c) => c.startsWith(inputVal.toLowerCase().trim()));
      if (match) {
        setInputVal(match);
      }
    }
  };

  const renderLineColor = (line: ConsoleLine) => {
    switch (line.type) {
      case 'input':
        return 'text-[var(--term-bright)] font-bold';
      case 'error':
        return 'text-red-400 font-bold';
      case 'notice':
        return 'text-[var(--term-dim)]';
      case 'success':
        return 'text-emerald-400 font-bold';
      case 'warning':
        return 'text-amber-400';
      default:
        return 'text-[var(--term-fg)]';
    }
  };

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className="border border-[var(--term-border)] bg-black/90 p-3 sm:p-4 font-mono text-xs cursor-text flex flex-col h-[280px] sm:h-[340px]"
    >
      <div className="flex items-center justify-between pb-1 mb-2 border-b border-[var(--term-border)]/40 text-[10px] text-[var(--term-dim)] select-none">
        <span>C:\WINDOWS\System32\cmd.exe - [PARANOIA SESSION]</span>
        <span>TYPE 'help' FOR COMMAND LIST</span>
      </div>

      {/* Terminal Output Scroll Container */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-1 pr-1">
        {lines.map((line) => (
          <div key={line.id} className={`whitespace-pre-wrap break-words leading-relaxed ${renderLineColor(line)}`}>
            {line.text}
          </div>
        ))}
      </div>

      {/* Active Input Line */}
      <div className="mt-2 pt-2 border-t border-[var(--term-border)]/40 flex items-center gap-1.5 text-[var(--term-bright)]">
        <span className="font-bold shrink-0">C:\PARANOIA&gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          spellCheck={false}
          autoComplete="off"
          className="flex-1 bg-transparent text-[var(--term-bright)] outline-none border-none font-mono text-xs p-0 m-0"
        />
        <span className="w-2 h-4 bg-[var(--term-bright)] animate-cursor shrink-0" />
      </div>
    </div>
  );
};
