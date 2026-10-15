import type { Certificate, CertificateStatus } from "../types/certificate";

export function getCertificateStatus(
  certificate: Certificate,
  now = new Date(),
): CertificateStatus {
  if (certificate.status === "revoked") {
    return "revoked";
  }
  if (certificate.expiresAt && new Date(`${certificate.expiresAt}T23:59:59`) < now) {
    return "expired";
  }
  return "active";
}

export function formatDate(value: string | null): string {
  if (!value) {
    return "No expiry";
  }
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

export function verificationUrl(id: string): string {
  const url = new URL(window.location.href);
  url.search = new URLSearchParams({ verify: id }).toString();
  url.hash = "";
  return url.toString();
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function downloadDemoCertificate(certificate: Certificate): void {
  const safe = (value: string) => escapeHtml(value);
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>CertifyX demo certificate</title>
<style>
body{font:16px Georgia,serif;background:#f5f3ed;color:#242820;padding:48px}
main{max-width:760px;margin:auto;background:#fff;padding:64px;border:1px solid #d8d2c4;text-align:center}
small{letter-spacing:.16em;text-transform:uppercase;color:#8c7449}
h1{font-size:38px;font-weight:400;margin:20px 0}h2{font-size:27px;font-weight:400}
p{line-height:1.7}.id{font:12px monospace;color:#667064;margin-top:38px}
</style></head><body><main><small>CertifyX · Demo certificate</small>
<h1>Certificate of Achievement</h1><p>This demo record recognizes</p>
<h2>${safe(certificate.recipientName)}</h2><p>for the successful completion of</p>
<h2>${safe(certificate.title)}</h2><p>${safe(certificate.program)} · ${safe(certificate.institution)}</p>
<p>Issued ${safe(formatDate(certificate.issuedAt))}</p><p class="id">${safe(certificate.id)} · MOCK DATA — NOT A BLOCKCHAIN RECORD</p>
</main></body></html>`;

  const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `CertifyX-demo-${certificate.id}.html`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
