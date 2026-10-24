import React, { useState } from 'react';
import { CPP_NATIVE_ENGINE, CPP_BUILD_BAT } from '../utils/scriptsGenerator';
import { Copy, Check, Download, Terminal, Code, Cpu, ShieldCheck } from 'lucide-react';
import { soundFx } from '../utils/audio';

export const CppSourceViewer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cpp' | 'build' | 'cmake'>('cpp');
  const [copied, setCopied] = useState(false);

  const CMAKE_CONTENT = `cmake_minimum_required(VERSION 3.15)
project(ParanoiaTorRouter VERSION 2.5.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

if(WIN32)
    add_executable(paranoia paranoia.cpp)
    target_link_libraries(paranoia PRIVATE
        wininet
        ws2_32
        iphlpapi
        advapi32
        shell32
    )
    if(MSVC)
        target_compile_options(paranoia PRIVATE /W3 /O2 /EHsc /D_CRT_SECURE_NO_WARNINGS)
    else()
        target_compile_options(paranoia PRIVATE -Wall -O3)
        target_link_options(paranoia PRIVATE -static-libgcc -static-libstdc++)
    endif()
endif()
`;

  const getCode = () => {
    switch (activeTab) {
      case 'cpp':
        return CPP_NATIVE_ENGINE;
      case 'build':
        return CPP_BUILD_BAT;
      case 'cmake':
        return CMAKE_CONTENT;
    }
  };

  const getFileName = () => {
    switch (activeTab) {
      case 'cpp':
        return 'paranoia.cpp';
      case 'build':
        return 'build.bat';
      case 'cmake':
        return 'CMakeLists.txt';
    }
  };

  const handleCopy = () => {
    soundFx.playBeep(1200, 0.04);
    navigator.clipboard.writeText(getCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    soundFx.playBeep(900, 0.06);
    const blob = new Blob([getCode()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = getFileName();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="border border-[var(--term-border)] bg-black/90 p-3 sm:p-4 font-mono text-xs select-none mb-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-[var(--term-border)] pb-2.5 mb-3 gap-2">
        <div className="flex items-center gap-2 font-bold text-[var(--term-bright)]">
          <Code className="w-4 h-4 text-emerald-400" />
          <span>NATIVE C++ ENGINE SOURCE & COMPILATION PIPELINE (paranoia.cpp)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-2.5 py-1 border border-[var(--term-border)] hover:border-[var(--term-bright)] hover:bg-[var(--term-fg)]/10 text-xs flex items-center gap-1 cursor-pointer transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'COPIED!' : 'COPY CODE'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="px-3 py-1 border border-[var(--term-bright)] bg-[var(--term-fg)] text-black font-bold text-xs flex items-center gap-1 cursor-pointer hover:bg-[var(--term-accent)] transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>DOWNLOAD {getFileName()}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--term-border)]/60 bg-black/50 text-xs mb-3">
        <button
          onClick={() => {
            soundFx.playBeep(900, 0.04);
            setActiveTab('cpp');
          }}
          className={`px-3 py-1.5 border-r border-[var(--term-border)] flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'cpp'
              ? 'bg-[var(--term-bg)] text-[var(--term-bright)] font-bold border-b-2 border-b-[var(--term-bright)]'
              : 'text-[var(--term-dim)] hover:text-[var(--term-fg)]'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>paranoia.cpp (Native C++ Source)</span>
        </button>
        <button
          onClick={() => {
            soundFx.playBeep(900, 0.04);
            setActiveTab('build');
          }}
          className={`px-3 py-1.5 border-r border-[var(--term-border)] flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'build'
              ? 'bg-[var(--term-bg)] text-[var(--term-bright)] font-bold border-b-2 border-b-[var(--term-bright)]'
              : 'text-[var(--term-dim)] hover:text-[var(--term-fg)]'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>build.bat (MSVC / MinGW Compiler)</span>
        </button>
        <button
          onClick={() => {
            soundFx.playBeep(900, 0.04);
            setActiveTab('cmake');
          }}
          className={`px-3 py-1.5 border-r border-[var(--term-border)] flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'cmake'
              ? 'bg-[var(--term-bg)] text-[var(--term-bright)] font-bold border-b-2 border-b-[var(--term-bright)]'
              : 'text-[var(--term-dim)] hover:text-[var(--term-fg)]'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          <span>CMakeLists.txt</span>
        </button>
      </div>

      {/* Compiler Instructions Callout */}
      <div className="p-3 bg-black/70 border border-[var(--term-border)]/50 mb-3 text-[11px] space-y-1.5">
        <div className="font-bold text-[var(--term-bright)] flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>HOW TO COMPILE ON WINDOWS (ZERO HTML / ZERO JAVASCRIPT):</span>
        </div>
        <div className="text-[var(--term-dim)] leading-relaxed">
          Open Developer Command Prompt for Visual Studio 2022 and compile directly into a native Windows PE64 executable:
        </div>
        <div className="p-2 bg-black border border-[var(--term-border)] text-emerald-400 font-mono select-text">
          cl.exe /O2 /EHsc paranoia.cpp wininet.lib ws2_32.lib iphlpapi.lib advapi32.lib /Fe:paranoia.exe
        </div>
        <div className="text-[10px] text-[var(--term-dim)]">
          Or compile with MinGW: <code className="text-[var(--term-bright)]">g++ -O3 paranoia.cpp -o paranoia.exe -lwininet -lws2_32 -liphlpapi -ladvapi32</code>
        </div>
      </div>

      {/* Code Container */}
      <div className="max-h-96 overflow-y-auto p-3 bg-black border border-[var(--term-border)] font-mono text-[11px] text-[var(--term-fg)] select-text">
        <pre className="whitespace-pre leading-relaxed">{getCode()}</pre>
      </div>
    </div>
  );
};
