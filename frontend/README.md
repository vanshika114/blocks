# CertifyX frontend demo

This React + Vite + TypeScript frontend uses plain CSS, `lucide-react` icons, and `qrcode.react` for QR rendering. It has an in-memory mock service by default and an optional Google Apps Script adapter for off-chain certificate metadata. It does not connect to a wallet or blockchain, or upload files to remote storage.

## Run locally

From this directory:

```sh
npm install
npm run dev
```

The development server prints its local URL. For a production build, use `npm run build`; `npm run typecheck` runs the TypeScript project check.

## Demo behavior and data lifecycle

- `src/types/certificate.ts` defines the shared certificate model.
- `src/data/mockCertificates.ts` contains non-sensitive example records.
- `src/services/certificateService.ts` defines the application service contract.
- `src/services/mockCertificateService.ts` is the default in-memory implementation; `src/services/configuredCertificateService.ts` selects it or the Apps Script adapter based on `VITE_CERTIFICATE_API_URL`.
- The app reads and updates the selected service for dashboard counts, registry search, issuance, verification, and revocation.
- Newly issued or revoked records exist only in memory. A page refresh resets the mock state to the seed records. Certificate uploads are validated in the browser, but only the selected file name is recorded; the file is not uploaded or persisted.
- The QR code contains a local URL with a certificate ID. It is a navigation aid, not a cryptographic proof or signed credential.
- With the mock selected, verification checks only whether an ID exists in the in-memory demo registry and whether its mock status is active, revoked, or expired. With Apps Script selected, lookup uses the off-chain metadata API and does not establish authenticity.
- Admin-like controls are presentation-only. There is no authentication or secure role authorization.

## Google Apps Script / Sheets metadata adapter

The optional adapter is implemented in `src/services/appsScriptCertificateService.ts`; its contract remains behind `CertificateService`. With no endpoint configured, the app uses the in-memory mock. Setting `VITE_CERTIFICATE_API_URL` selects Apps Script; it does not silently fall back to mock data if the request fails.

Google Sheets is an **off-chain metadata store**, not proof of authenticity, blockchain state, or a trusted hash. The API and adapter do not issue on-chain certificates, compare document hashes, or verify transaction confirmations.

### Request and response contract (version 1)

Every operation is a `POST` with `Content-Type: text/plain;charset=UTF-8` and this JSON body:

```json
{ "version": 1, "operation": "get", "payload": { "id": "CX-2026-A1B2C3D4" } }
```

Success is `{ "ok": true, "data": ... }`. Errors are `{ "ok": false, "error": { "code": "...", "message": "..." } }`. Apps Script `ContentService` does not provide application-selected HTTP status codes; callers must inspect `ok` in the JSON envelope. All fields are allowlisted; unknown request and metadata properties are rejected.

| Operation | Payload | Data |
|---|---|---|
| `create` | `{ "certificate": { "recipientName": "…", "title": "…", "program": "…", "institution": "…", "issuedAt": "YYYY-MM-DD", "expiresAt": null } }` | `{ "certificate": record }` |
| `list` | `{ "limit": 50, "offset": 0, "status": "active", "institution": "…" }` — all fields optional; `limit` max 100; status is `active`, `revoked`, or derived `expired` | `{ "items": [record], "total": 1, "nextOffset": null }` |
| `get` | `{ "id": "CX-2026-A1B2C3D4" }` | `{ "certificate": record }`; missing IDs return `NOT_FOUND` |
| `update` | `{ "id": "…", "metadata": { "title": "…", "program": "…", "institution": "…", "expiresAt": null } }` — at least one allowed property | `{ "certificate": record }`; each change increments `revision` |
| `revoke` | `{ "id": "…", "reason": "…", "transactionReference": "0x…64 hex chars…" }` — reference optional | `{ "certificate": record }` with explicit off-chain revocation metadata |

The server generates IDs on create. Certificate records contain only an ID, recipient name, title, program, institution, dates, status, revocation metadata, and revision timestamps. Recipient email, file names, document contents, and document hashes are never sent to or stored in the spreadsheet by this adapter. The issue form’s email remains local to the page in Apps Script mode and is optional; the selected file is never uploaded.

Every record has `id`, `recipientName`, `title`, `program`, `institution`, `issuedAt`, `expiresAt`, `status`, and `revocation`. Active records have `revocation: null`. A revoked record has:

```json
{
  "reason": "Correction requested",
  "recordedAt": "2026-10-15T08:00:00.000Z",
  "storage": "off_chain_metadata",
  "transactionReference": null,
  "transactionReferenceVerified": false
}
```

`transactionReference` is optional and syntactically checked only. Supplying a reference does **not** mean that a transaction occurred, succeeded, or was verified. The UI’s revoke operation sends no transaction reference and clearly reports that it only saved off-chain metadata.

The server validates API version, operation and exact fields, text length/control characters, certificate IDs, dates and date ordering, pagination, status, metadata updates, and optional transaction-reference format. It serializes concurrent writes with a script lock, rejects duplicate generated IDs, checks a fixed `Certificates` sheet and exact header row, and escapes spreadsheet formula-leading text. Mutations and reads require the caller’s Google account to be in the server-side `ALLOWED_ISSUERS` allowlist.

### Configure and deploy

1. Create a Google Sheet in the institution’s Workspace. Add one tab named `Certificates`. Put the following exact headers in row 1, in this order, with no extra columns:

   ```text
   id | recipientName | title | program | institution | issuedAt | expiresAt | status | revocationReason | revokedAt | revocationTransactionReference | createdAt | updatedAt | revision
   ```

   Leave records below the header for the API. Do not add email addresses, document names/files, hashes, or unrelated data to this tab.
2. Create a standalone Apps Script project in the same Workspace. Copy `apps-script/Code.gs` into its script editor and save.
3. In **Project Settings → Script Properties**, set:
   - `SPREADSHEET_ID`: the ID from the spreadsheet URL (not the URL itself).
   - `ALLOWED_ISSUERS`: comma-separated institutional Google account email addresses permitted to use the API.

   These values stay in Apps Script, not frontend source or Vite variables. Grant each allowed issuer the necessary spreadsheet access. `Session.getActiveUser()` must resolve to the caller; the API denies access if it cannot determine an allowlisted identity.
4. Deploy as a **Web app**. For a Workspace deployment, choose **Execute as: User accessing the web app** and restrict access to the institution’s users. Do not deploy a publicly writable endpoint or execute the API as the owner for unauthenticated callers. Review Google Workspace policy and the identity behavior of the chosen deployment before use with real records.
5. Copy the deployed `/exec` URL into the local frontend configuration. In `frontend/`, copy `.env.example` to `.env.local` and set:

   ```dotenv
   VITE_CERTIFICATE_API_URL=https://script.google.com/macros/s/DEPLOYMENT_ID/exec
   ```

   The URL is a public endpoint, not a secret. Never put a key, password, private key, or privileged credential in a `VITE_` variable. Restart Vite after changing environment configuration. Remove the variable (or leave it empty) to use the mock service again.

### Test the API after your own deployment

No sheet or Apps Script project was created or deployed for this repository. Once an authorized administrator has configured and deployed it:

1. Sign in to the frontend browser with an allowlisted institutional Google account; run `npm run dev` from `frontend/` with `.env.local` configured.
2. Confirm the registry loads from the API. Issue a clearly marked test record and verify that the sheet receives only the allowlisted metadata fields, never the form email or attachment.
3. Retrieve it via the UI’s verification lookup. To exercise the metadata update operation, call `certificateService.updateOffChainMetadata(id, { title: "Updated test title" })` from an authorized application integration; confirm `revision` increments.
4. Revoke the test record in the UI with a reason. Confirm the sheet records `status`, reason, timestamp, and an empty transaction reference; the UI must say no blockchain transaction occurred.
5. Remove test rows from the `Certificates` tab manually after the test, if appropriate for your institution.
6. Confirm that a non-allowlisted account receives a `FORBIDDEN` envelope. Also test malformed input and an unknown ID; the API should return an `INVALID_*` or `NOT_FOUND` envelope, not a successful record.

The adapter uses a simple text/plain POST to avoid a JSON preflight, but Google Apps Script redirects and browser third-party-cookie/CORS policies vary by deployment and Workspace. The browser connection has not been verified here. If the deployed endpoint cannot be called from the frontend, do not weaken the sheet access policy: use a same-origin authenticated server-side proxy, or diagnose the deployment’s CORS/identity behavior first.

## Future local Hardhat / contract adapter

Keep wallet and contract operations outside React views. A future blockchain adapter should expose explicit operations for:

1. Issuing a certificate and returning the transaction hash and confirmation status.
2. Reading an on-chain certificate record.
3. Verifying a document hash against the trusted on-chain hash.
4. Revoking a certificate, including authorization and transaction outcomes.
5. Reporting pending, confirmed, reverted, and failed transaction states/errors to the UI.

The current repository contract at `../blockchain/contracts/Counter.sol` is only a Counter example. This frontend intentionally does not modify it, assume a certificate contract ABI, define a contract address, connect a wallet, or simulate on-chain success. Implement and test the actual registry contract before adding that adapter.
