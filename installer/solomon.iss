; Solomon Agent — Inno Setup installer script
; Build on Windows after: dotnet publish src/Solomon.Worker -c Release -r win-x64 --self-contained

#define MyAppName "Solomon Agent"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Solomon"
#define MyAppExeName "Solomon.Worker.exe"

[Setup]
AppId={{F8E2A1B0-5C3D-4E6F-9A8B-1C2D3E4F5A6B}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
DefaultDirName={commonpf64}\Solomon
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
OutputBaseFilename=SolomonAgent-Setup
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Files]
Source: "..\publish\Solomon.Worker\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Dirs]
Name: "{commonappdata}\Solomon\logs"; Permissions: users-modify

[Icons]
Name: "{group}\Solomon Admin Panel"; Filename: "http://127.0.0.1:5050/"; IconFilename: "{app}\{#MyAppExeName}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"

[Run]
Filename: "sc.exe"; Parameters: "create ""Solomon Agent"" binPath= ""{app}\{#MyAppExeName}"" start= auto DisplayName= ""Solomon Agent"""; Flags: runhidden; StatusMsg: "Registering Windows Service..."; Check: not ServiceExists('Solomon Agent')
Filename: "sc.exe"; Parameters: "description ""Solomon Agent"" ""Bridges cloud web app with local file-drop folder."""; Flags: runhidden; Check: not ServiceExists('Solomon Agent')
Filename: "sc.exe"; Parameters: "start ""Solomon Agent"""; Flags: runhidden; StatusMsg: "Starting service..."; Check: not ServiceExists('Solomon Agent')
Filename: "http://127.0.0.1:5050/"; Description: "Open admin panel"; Flags: postinstall shellexec skipifsilent

[UninstallRun]
Filename: "sc.exe"; Parameters: "stop ""Solomon Agent"""; Flags: runhidden
Filename: "sc.exe"; Parameters: "delete ""Solomon Agent"""; Flags: runhidden

[Code]
function ServiceExists(ServiceName: String): Boolean;
var
  ResultCode: Integer;
begin
  Result := Exec('sc.exe', 'query "' + ServiceName + '"', '', SW_HIDE, ewWaitUntilTerminated, ResultCode) and (ResultCode = 0);
end;

function InitializeSetup(): Boolean;
begin
  Result := True;
end;

[Messages]
FinishedLabel=Solomon Agent is installed. Open http://127.0.0.1:5050/ to enter your enrollment code and configure the Input folder.
