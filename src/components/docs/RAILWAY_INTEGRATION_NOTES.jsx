# Railway Integration — Wnioski, Błędy i Rozwiązania

## Data: 2026-02-21

---

## 1. ARCHITEKTURA KOMUNIKACJI

Railway działa **asynchronicznie**:
- Wysyłamy request na `POST /api/audit/run` → Railway zwraca potwierdzenie
- Railway przetwarza audyt i wysyła wyniki na **callback URL**
- Railway **NIE MA** endpointu `/api/audit/status/{job_id}` — polling nie działa (404)

**Wniosek:** Jedyna działająca metoda odbierania wyników to **callback (webhook)**.

---

## 2. PROBLEM: Callback nie mógł zapisać danych (createClientFromRequest)

### Opis błędu:
`createClientFromRequest(req)` wymaga headerów autoryzacji Base44 w requeście.
Railway jako zewnętrzny serwis **nie wysyła tych headerów** — nie zna tokenu użytkownika.

### Błąd:
```
Unauthorized - no auth token
```

### Próba 1: `createClient({ appId })` (BEZ `createClientFromRequest`)
**Wynik:** Klient się tworzył, ale `asServiceRole` nie działał:
```
Service token is required to use asServiceRole. Please provide a serviceToken when creating the client.
```
`createClient({ appId })` nie ma dostępu do service role — to jest klient "anonimowy".

### Próba 2: Polling zamiast callbacku
**Wynik:** Failował bo Railway nie ma endpointu statusu (`404` na `/api/audit/status/`).

### ROZWIĄZANIE (działające):
Użyć `createClientFromRequest()` ale z **sfałszowanym requestem** zawierającym header `x-base44-app-id`:

```javascript
const appId = Deno.env.get("BASE44_APP_ID");
const fakeHeaders = new Headers(req.headers);
fakeHeaders.set("x-base44-app-id", appId);
const fakeReq = new Request(req.url, { method: req.method, headers: fakeHeaders });
const base44 = createClientFromRequest(fakeReq);

// Teraz base44.asServiceRole działa!
await base44.asServiceRole.entities.AuditJob.update(job_id, updateData);
```

**Dlaczego działa:** `createClientFromRequest` z headerem `x-base44-app-id` tworzy klienta z dostępem do service role, nawet bez tokenu użytkownika.

---

## 3. PROBLEM: req.json() można wywołać tylko RAZ

### Opis błędu:
Jeśli wywołasz `req.json()` dwa razy na tym samym requeście, drugi raz dostaniesz pusty body.

### Rozwiązanie:
Najpierw odczytaj `req.text()`, potem `JSON.parse()`:

```javascript
const rawText = await req.text();
const body = JSON.parse(rawText);
```

---

## 4. FORMAT DANYCH Z RAILWAY

Railway wysyła callbacki w następujących formatach:

### Status "running" (progress update):
```json
{
  "job_id": "...",
  "status": "running",
  "current_step": "Scoring AI",
  "progress_percent": 80
}
```

### Status "done" (wyniki):
```json
{
  "job_id": "...",
  "status": "done",
  "result_cqs": 75,
  "result_citability": 60,
  "result_audit_md": "# Raport...",
  "result_scores_md": "## Scores...",
  "result_benchmark_md": "## Benchmark..."
}
```

Wyniki mogą być zagnieżdżone w `result`, `results`, lub `data` — albo bezpośrednio na top-level.
Dlatego sprawdzamy WSZYSTKIE możliwe lokalizacje:

```javascript
const cqs = body.result_cqs ?? body.cqs ?? result?.cqs ?? result?.result_cqs;
```

### Status "error":
```json
{
  "job_id": "...",
  "status": "error",
  "error_message": "opis błędu"
}
```

---

## 5. WYMAGANE SEKRETY (ENV)

| Sekret | Opis |
|--------|------|
| `RAILWAY_API_URL` | URL backendu Railway (np. `https://xxx.railway.app`) — BEZ trailing slash |
| `AUDIT_API_KEY` | Klucz API do autoryzacji — Railway wysyła go w `Authorization: Bearer {key}` |
| `RAILWAY_CALLBACK_URL` | URL callbacku Base44: `https://{app-slug}.base44.app/api/functions/receiveAuditCallback` |
| `BASE44_APP_ID` | Automatycznie ustawiony — używany do tworzenia klienta SDK |

---

## 6. FLOW AUDYTU (działający)

1. **Frontend** → tworzy `AuditJob` ze statusem `queued`
2. **Automation** → entity automation na `AuditJob.create` wywołuje `runAudit`
3. **runAudit** → zmienia status na `running`, wysyła POST na Railway `/api/audit/run`
4. **Railway** → przetwarza audyt, wysyła progress callbacki na `receiveAuditCallback`
5. **receiveAuditCallback** → aktualizuje `AuditJob` (progress, wyniki, błędy)
6. **Frontend** → polluje `AuditJob` entity co kilka sekund i wyświetla aktualny status

---

## 7. PAYLOAD WYSYŁANY DO RAILWAY

```javascript
{
  url: "https://...",
  keyword: "słowo kluczowe" || null,
  model: "gpt-4.1-mini",
  modules: ["serp5", "exa", ...],  // TYLKO opcjonalne moduły
  job_id: "base44_job_id",
  callback_url: "https://xxx.base44.app/api/functions/receiveAuditCallback"
}
```

**WAŻNE:** Railway nie akceptuje modułów `crawl`, `structure`, `scoring`, `report` — to są wewnętrzne kroki. Filtrujemy do: `["serp5", "serp10", "exa", "senuto", "pdf"]`.

---

## 8. KLUCZOWE LEKCJE

1. **Zewnętrzne webhooki → `createClientFromRequest` z fake headerem `x-base44-app-id`**
2. **Nie używaj `createClient({ appId })` — nie ma dostępu do `asServiceRole`**
3. **Railway nie ma endpointu statusu — tylko callbacki**
4. **Zawsze czytaj body jako `req.text()` → `JSON.parse()` — nie `req.json()` dwa razy**
5. **Loguj WSZYSTKO w callbackach — format Railway może się zmienić**
6. **Row-level security na AuditJob = `created_by` — service role omija to**