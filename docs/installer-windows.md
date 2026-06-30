# Solomon Agent — Windows installer (Inno Setup)

Ovaj vodič objašnjava kako na **Windows Server / Windows 10+** mašini napraviti `SolomonAgent-Setup.exe` iz ovog repozitorijuma.

## Preduslovi

| Alat | Verzija | Napomena |
|------|---------|----------|
| **Windows** | 10/11 ili Server 2019+ | Installer se ne pravi na macOS/Linux |
| **.NET SDK** | 8.0.x | [dotnet.microsoft.com](https://dotnet.microsoft.com/download) |
| **Node.js** | 20 LTS+ | Za Next.js admin UI build |
| **Inno Setup** | 6.x | [jrsoftware.org/isinfo.php](https://jrsoftware.org/isinfo.php) — opciono za `.exe`, ZIP radi i bez njega |
| **PowerShell** | 5.1+ | Ugrađen na Windowsu |

## Brzi put (preporučeno)

```powershell
# 1. Kloniraj repo
git clone https://github.com/saramandicmarko02-lang/Solomon.git
cd Solomon

# 2. Jedan korak: admin UI + dotnet publish + ZIP (+ Inno EXE ako je instaliran)
powershell -ExecutionPolicy Bypass -File .\installer\build-package.ps1
```

**Izlaz:**

| Fajl | Putanja |
|------|---------|
| ZIP paket | `dist\SolomonAgent-1.0.0-win-x64.zip` |
| Inno installer | `dist\SolomonAgent-Setup.exe` (samo ako je Inno Setup 6 instaliran) |

`build-package.ps1` radi sledeće redom:

1. `installer\build-admin-ui.ps1` — `npm run build` → kopira statiku u `src\Solomon.AdminUI\wwwroot\`
2. `dotnet publish src\Solomon.Worker` — self-contained win-x64 u `publish\Solomon.Worker\`
3. Pakuje ZIP + pokreće `ISCC.exe installer\solomon.iss` ako postoji

## Ručni koraci (ako želiš kontrolu)

```powershell
# Admin UI
powershell -ExecutionPolicy Bypass -File .\installer\build-admin-ui.ps1

# .NET Worker
dotnet publish src\Solomon.Worker\Solomon.Worker.csproj `
  -c Release -r win-x64 --self-contained true `
  -o publish\Solomon.Worker

# Samo Inno Setup EXE (publish folder mora postojati)
& "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe" .\installer\solomon.iss
```

## Šta Inno Setup radi

Skripta `installer\solomon.iss`:

- Kopira sadržaj `publish\Solomon.Worker\` u `C:\Program Files\Solomon\`
- Kreira Windows servis **Solomon Agent** (`sc create`, `start= auto`)
- Pokreće servis
- Dodaje prečicu ka admin panelu: `http://127.0.0.1:5050/`
- Pri deinstalaciji: `sc stop` + `sc delete`

**Admin panel** se servira iz ugrađenog `wwwroot\` foldera u publish output-u (Next.js static export).

## Instalacija na serveru

1. Prebaci `dist\SolomonAgent-Setup.exe` na Windows mašinu
2. Pokreni **kao Administrator**
3. Otvori `http://127.0.0.1:5050/`
4. Unesi API URL, Input folder, enrollment kod

## CI (GitHub Actions)

Workflow `.github/workflows/build-installer.yml` na `windows-latest`:

- Node 20 + .NET 8
- `installer/build-package.ps1`
- Artefakti: ZIP i (ako je Inno dostupan na runneru) Setup EXE

## Troubleshooting

| Problem | Rešenje |
|---------|---------|
| `Node.js is required` | Instaliraj Node 20 LTS, restartuj terminal |
| `Inno Setup not found` | ZIP je i dalje validan; instaliraj Inno 6 i ponovi build |
| Admin panel prazan / stari UI | Ponovo pokreni `build-admin-ui.ps1` pre publish-a |
| Port 5050 zauzet | Promeni Admin port u podešavanjima i restartuj servis |
| Servis ne startuje | Proveri `%ProgramData%\Solomon\logs\` |

## Code signing (produkcija)

Za manje SmartScreen upozorenja potpiši `Solomon.Worker.exe` i setup EXE Authenticode certifikatom pre distribucije klijentima.
