# CertifyX frontend demo

This is a standalone React + Vite + TypeScript frontend prototype. It uses plain CSS, `lucide-react` icons, and `qrcode.react` for QR rendering. It does not connect to a wallet, blockchain, API, Google Apps Script, Google Sheets, or remote file storage.

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
- `src/services/mockCertificateService.ts` is the current in-memory implementation used by the UI.
- The app reads and updates this same service for dashboard counts, registry search, issuance, verification, and revocation.
- Newly issued or revoked records exist only in memory. A page refresh resets the mock state to the seed records. Certificate uploads are validated in the browser, but only the selected file name is recorded; the file is not uploaded or persisted.
- The QR code contains a local URL with a certificate ID. It is a navigation aid, not a cryptographic proof or signed credential.
- The sample verification screen checks only whether an ID exists in the in-memory demo registry and whether its mock status is active, revoked, or expired.
- Admin-like controls are presentation-only. There is no authentication or secure role authorization.

## Future Google Apps Script / Sheets adapter

Replace the in-memory implementation behind `CertificateService` with a client for a separately deployed and secured Google Apps Script API. Keep credentials and deployment URLs out of source code; inject the configured endpoint through deployment configuration, and never put privileged secrets in browser code.

The future off-chain metadata API should define and validate operations equivalent to:

1. **Create a certificate record:** accept a certificate ID, recipient-facing metadata, institution, and on-chain transaction/record reference when available; reject duplicate IDs.
2. **List and retrieve metadata:** support paginated, filtered institution records and lookup by certificate ID.
3. **Update off-chain metadata:** restrict editable fields and record update provenance/version where needed.
4. **Record revocation metadata:** store the reason and timestamp plus the transaction/reference for an on-chain revocation when one exists.

Google Sheets is an off-chain metadata convenience, not proof of authenticity or the authority for blockchain state. Avoid storing unnecessary personal information. Use an authenticated, server-validated API for any real institution deployment; do not treat a browser-only role switch as authorization.

## Future local Hardhat / contract adapter

Keep wallet and contract operations outside React views. A future blockchain adapter should expose explicit operations for:

1. Issuing a certificate and returning the transaction hash and confirmation status.
2. Reading an on-chain certificate record.
3. Verifying a document hash against the trusted on-chain hash.
4. Revoking a certificate, including authorization and transaction outcomes.
5. Reporting pending, confirmed, reverted, and failed transaction states/errors to the UI.

The current repository contract at `../blockchain/contracts/Counter.sol` is only a Counter example. This frontend intentionally does not modify it, assume a certificate contract ABI, define a contract address, connect a wallet, or simulate on-chain success. Implement and test the actual registry contract before adding that adapter.
