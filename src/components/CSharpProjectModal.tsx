import { useState } from 'react';
import { CSHARP_FILES, CSharpSourceFile } from '../utils/csharpSources';
import JSZip from 'jszip';
import {
  FileCode,
  Copy,
  Check,
  Download,
  FolderArchive,
  Terminal,
  Cpu,
  ShieldCheck,
  X,
  ExternalLink,
} from 'lucide-react';

interface CSharpProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CSharpProjectModal({ isOpen, onClose }: CSharpProjectModalProps) {
  const [selectedFile, setSelectedFile] = useState<CSharpSourceFile>(CSHARP_FILES[0]);
  const [copiedFile, setCopiedFile] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  if (!isOpen) return null;

  const publishCmd = `dotnet publish Paranoia\\Paranoia.csproj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true -o .\\bin\\publish`;

  const copyToClipboard = async (text: string, type: 'file' | 'cmd') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'file') {
        setCopiedFile(true);
        setTimeout(() => setCopiedFile(false), 2000);
      } else {
        setCopiedCmd(true);
        setTimeout(() => setCopiedCmd(false), 2000);
      }
    } catch {}
  };

  const downloadProjectZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      
      CSHARP_FILES.forEach((file) => {
        zip.file(file.relativePath, file.content);
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Paranoia-CSharp-WinX64-Solution.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to create zip:', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-[#0b0f14] border border-cyan-500/50 rounded-lg shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden text-neutral-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-neutral-900 via-[#101923] to-neutral-900 px-6 py-4 border-b border-cyan-900/50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-cyan-300 font-mono tracking-wide">
                  PARANOIA.CSPROJ &amp; VISUAL STUDIO SOLUTION
                </h2>
                <span className="px-2 py-0.5 text-xs font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 rounded">
                  .NET 8.0 Windows x64
                </span>
                <span className="px-2 py-0.5 text-xs font-mono bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 rounded">
                  Standalone Paranoia.exe
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-mono mt-0.5">
                Native C# Windows Console Executable • Zero HTML/Batch Dependencies • Preconfigured for Visual Studio 2022
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

        {/* Top Action Bar */}
        <div className="bg-[#0e1620] px-6 py-3 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs font-mono text-neutral-300">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="text-neutral-400">Publish Command:</span>
            <code className="bg-black/60 px-2 py-1 rounded text-cyan-300 border border-neutral-800 select-all font-mono">
              dotnet publish -c Release -r win-x64 --self-contained
            </code>
            <button
              onClick={() => copyToClipboard(publishCmd, 'cmd')}
              className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-cyan-300 rounded text-xs flex items-center space-x-1 border border-neutral-700 transition"
              title="Copy complete dotnet publish command"
            >
              {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCmd ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={downloadProjectZip}
              disabled={isZipping}
              className="px-4 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono font-bold text-xs rounded shadow flex items-center space-x-1.5 transition active:scale-95 disabled:opacity-50"
            >
              <FolderArchive className="w-4 h-4" />
              <span>{isZipping ? 'Packaging ZIP...' : 'Download Solution (.ZIP)'}</span>
            </button>
          </div>
        </div>

        {/* Main Content: Left File Tree, Right Editor */}
        <div className="flex-1 flex overflow-hidden">
          {/* File Explorer Sidebar */}
          <div className="w-64 bg-[#090d12] border-r border-neutral-800/80 flex flex-col p-3 overflow-y-auto">
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-semibold mb-2 px-1">
              Solution Explorer (8 Files)
            </div>

            <div className="space-y-1">
              {CSHARP_FILES.map((file) => {
                const isSelected = selectedFile.name === file.name;
                const isCsproj = file.name.endsWith('.csproj') || file.name.endsWith('.sln');
                return (
                  <button
                    key={file.name}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full text-left px-2.5 py-1.5 rounded font-mono text-xs flex items-center space-x-2 transition ${
                      isSelected
                        ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-500/40 font-semibold'
                        : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
                    }`}
                  >
                    <FileCode
                      className={`w-4 h-4 flex-shrink-0 ${
                        isCsproj ? 'text-amber-400' : 'text-cyan-400'
                      }`}
                    />
                    <div className="truncate">
                      <div className="truncate">{file.name}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Tips */}
            <div className="mt-auto pt-4 border-t border-neutral-800/60 text-[11px] font-mono text-neutral-400 space-y-2">
              <div className="text-cyan-400 font-bold flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Single-File Output</span>
              </div>
              <p className="text-[10px] leading-relaxed text-neutral-400">
                Compiles to <span className="text-emerald-400">Paranoia.exe</span>. All .NET runtime libraries and Tor controllers are packed into one binary.
              </p>
            </div>
          </div>

          {/* Code Viewer */}
          <div className="flex-1 flex flex-col bg-[#06080b] overflow-hidden">
            {/* Tab Bar / File Meta */}
            <div className="bg-[#0c1117] px-4 py-2 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-mono">
                <span className="text-cyan-400 font-semibold">{selectedFile.relativePath}</span>
                <span className="text-neutral-400">•</span>
                <span className="text-neutral-400 text-[11px]">{selectedFile.description}</span>
              </div>
              <button
                onClick={() => copyToClipboard(selectedFile.content, 'file')}
                className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-xs font-mono flex items-center space-x-1 border border-neutral-700 transition"
              >
                {copiedFile ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedFile ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>

            {/* Code Content */}
            <div className="flex-1 p-4 overflow-auto font-mono text-xs leading-relaxed text-neutral-300 bg-[#06080b]">
              <pre className="whitespace-pre">{selectedFile.content}</pre>
            </div>
          </div>
        </div>

        {/* Footer Build Notes */}
        <div className="bg-[#090d12] px-6 py-3 border-t border-neutral-800 flex flex-wrap items-center justify-between text-xs font-mono text-neutral-400">
          <div>
            <span className="text-cyan-400 font-bold">Build Command: </span>
            <span className="text-neutral-300">cd dotnet && build.cmd</span> (Or open Paranoia.sln in Visual Studio 2022)
          </div>
          <div className="text-emerald-400 font-semibold">
            Run with Admin: Paranoia.exe requests UAC via app.manifest
          </div>
        </div>
      </div>
    </div>
  );
}
