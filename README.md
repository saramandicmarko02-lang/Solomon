# Solomon Agent

Windows middleware servis koji povezuje vašu cloud web aplikaciju sa lokalnim **Input** folderom (file-drop za back-office / banking desktop aplikaciju).

Podržani OS: **Windows 10/11**, **Windows Server 2019/2022/2025**.

## Šta radi

- Održava **outbound WebSocket** (`wss://`) ka cloud serveru — nikada ne sluša mrežne inbound konekcije
- Na interval (5–10 s) šalje **heartbeat** sa listom immediate subfoldera u Input folderu
- Prima **job_dispatch** poruke i atomski upisuje fajlove (temp → rename)
- Javlja **job_status** (`delivered` / `failed`) nazad serveru
- Čuva enrollment token **enkriptovano** (Windows DPAPI, CurrentUser scope)
- Servira **lokalni admin panel** na `http://127.0.0.1:5050` (samo localhost)

## Struktura solution-a

```
Solomon/
├── src/
│   ├── Solomon.Core/       — protokol, ConfigStore (DPAPI), FolderScanner, JobWriter
│   ├── Solomon.Worker/     — Windows Service + WebSocket agent + Kestrel host
│   └── Solomon.AdminUI/    — lokalni admin API + embedded UI
├── docs/agent-protocol.md  — ugovor sa web app-om
└── installer/solomon.iss   — Inno Setup installer
```

## Brzi start (dev)

```powershell
# Windows, .NET 8 SDK
dotnet restore
dotnet run --project src/Solomon.Worker
# Otvorite http://127.0.0.1:5050/
```

## Produkcijski build + installer

```powershell
dotnet publish src/Solomon.Worker -c Release -r win-x64 --self-contained -o publish/Solomon.Worker
# Zatim kompajlirajte installer/solomon.iss u Inno Setup Compiler
```

### Windows Service ručno

```cmd
scripts\install-service.cmd
```

Konfiguracija i logovi:

| Putanja | Sadržaj |
|---------|---------|
| `%ProgramData%\Solomon\` | settings.json, credentials.json (DPAPI) |
| `%ProgramData%\Solomon\logs\` | rolling Serilog fajlovi |

## Admin panel

1. Unesite **URL cloud aplikacije** (npr. `https://api.example.com`)
2. Definišite **Input folder** — root gde back-office app očekuje fajlove
3. Unesite **enrollment kod** iz web app-a → POST na `/agent/enroll`
4. Pratite status konekcije i aktivnost

## Protokol

Detalji u [docs/agent-protocol.md](docs/agent-protocol.md).

## Arhitektura (preporuke)

| Tema | Izbor |
|------|-------|
| Worker + WebSocket | .NET 8 `BackgroundService` + `ClientWebSocket`, exponential backoff reconnect |
| Admin UI u istom procesu | `WebApplication` (Kestrel) na `127.0.0.1`, AdminUI kao referencirani projekat |
| Enkripcija | DPAPI `CurrentUser` — pokretati servis pod dedicated service account sa učitanim profilom |
| Logovanje | Serilog rolling file u `%ProgramData%\Solomon\logs` |
| Installer | **Inno Setup** (jednostavniji od WiX); za SmartScreen potreban **code signing** certifikat (EV preporučen) |

## Code signing

Da installer ne bude blokiran od strane SmartScreen/AV:

1. Nabavite Authenticode certifikat (EV za najmanje upozorenja)
2. Potpišite `Solomon.Worker.exe` i setup EXE (`signtool sign /fd SHA256 ...`)
3. Timestamp sa `http://timestamp.digicert.com`

## Napomena o Output folderu

Protokol trenutno definiše **Input folder** (pisanje fajlova ka lokalnoj aplikaciji). Ako vam treba i čitanje iz Output foldera (upload ka cloud-u), to je sledeća faza — javi ako treba proširiti protokol.
