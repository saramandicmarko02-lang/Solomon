# Solomon Agent Protocol

Canonical contract between the Solomon Windows agent and the cloud web application.

## Transport

- Agent maintains a persistent outbound **WebSocket** connection (`wss://`).
- Agent never listens for inbound network connections (except local admin UI on `127.0.0.1`).
- Reconnect with exponential backoff on failure.

## Messages

### Agent → Server (heartbeat, every 5–10 seconds)

```json
{
  "type": "heartbeat",
  "agentId": "uuid",
  "timestamp": "2026-06-20T10:00:00Z",
  "inputFolders": ["Subfolder1", "Subfolder2"],
  "inputRootPath": "C:\\Solomon\\Input",
  "paymentTraffic": "domestic",
  "filePrefix": "NA_"
}
```

`inputFolders` lists **immediate subdirectories** of the configured Input root folder. Empty array if none exist.

Optional fields:
- `inputRootPath` — configured Input root path on the agent machine
- `paymentTraffic` — `domestic` (domaći platni promet) or `foreign` (devizni)
- `filePrefix` — prefix for preuzete/poslate datoteke (default `NA_` for domestic, `NT_` for foreign)

### Server → Agent (job dispatch)

```json
{
  "type": "job_dispatch",
  "jobId": "uuid",
  "targetFolder": "Subfolder1",
  "fileName": "PAYMENT_20260620_0001.txt",
  "content": "...fixed-width string, already formatted...",
  "encoding": "windows-1250"
}
```

- `targetFolder`: subdirectory name under Input root, or `null` for Input root.
- `encoding`: defaults to `windows-1250` if omitted.

### Agent → Server (job status)

```json
{
  "type": "job_status",
  "jobId": "uuid",
  "status": "delivered",
  "error": null
}
```

`status` is `"delivered"` or `"failed"`. `error` is a human-readable message when failed.

## Enrollment

On first run, if no stored credentials exist, the admin UI collects a one-time enrollment code.

```
POST {serverBaseUrl}/agent/enroll
Content-Type: application/json

{
  "enrollmentCode": "one-time-code-from-web-app"
}
```

Expected response:

```json
{
  "agentId": "uuid",
  "authToken": "bearer-token-or-api-key",
  "webSocketUrl": "wss://api.example.com/agent/ws"
}
```

Credentials are stored encrypted at rest (Windows DPAPI) and used for subsequent WebSocket connections.

WebSocket connection should include authentication, e.g. header:

```
Authorization: Bearer {authToken}
```

Or query parameter as agreed with the server implementation.
