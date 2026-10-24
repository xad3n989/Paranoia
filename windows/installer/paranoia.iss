; ==============================================================================
;  PARANOIA - INNO SETUP COMPILER SCRIPT (paranoia.iss)
;  Compiles into: ParanoiaInstaller-v2.5.0-x64.exe
; ==============================================================================

#define MyAppName "PARANOIA"
#define MyAppVersion "2.5.0"
#define MyAppPublisher "Paranoia Security Group"
#define MyAppURL "https://github.com/paranoia-sec/paranoia"
#define MyAppExeName "paranoia.exe"

[Setup]
AppId={{9E3D824A-10C2-4E75-BB32-E64A5F112D97}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DisableProgramGroupPage=yes
LicenseFile=..\..\LICENSE
OutputDir=..\..\dist-installer
OutputBaseFilename=ParanoiaInstaller-v2.5.0-x64
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesInstallIn64BitMode=x64

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "killswitch"; Description: "Enable Windows Firewall Zero-Leak Killswitch Failsafe"; GroupDescription: "Security Features:"
Name: "autostart"; Description: "Start Tor Background Service on Windows boot"; GroupDescription: "Startup Options:"; Flags: unchecked

[Files]
Source: "..\cpp\paranoia.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\torrc"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\README.txt"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent
