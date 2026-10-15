import { useState } from "react";
import { AlertTriangle, Copy, Download, ExternalLink, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import { downloadDemoCertificate, formatDate, getCertificateStatus, verificationUrl } from "../lib/certificateUtils";
import type { Certificate } from "../types/certificate";
import { StatusBadge } from "./StatusBadge";

interface CertificateDetailsModalProps {
  certificate: Certificate;
  onClose: () => void;
  onRevoke: (certificate: Certificate) => void;
  onVerify: (id: string) => void;
}

export function CertificateDetailsModal({
  certificate,
  onClose,
  onRevoke,
  onVerify,
}: CertificateDetailsModalProps) {
  const [copied, setCopied] = useState(false);
  const status = getCertificateStatus(certificate);
  const link = verificationUrl(certificate.id);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
      window.prompt("Copy this demo verification link:", link);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="details-modal" role="dialog" aria-modal="true" aria-labelledby="details-title">
        <div className="modal-heading">
          <div>
            <span className="eyebrow">Certificate record</span>
            <h2 id="details-title">Credential details</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close details">
            <X size={18} />
          </button>
        </div>
        <div className="demo-notice compact-notice">
          <AlertTriangle size={16} />
          <span>Demo record only. This is not on-chain proof.</span>
        </div>
        <div className="detail-hero">
          <div className="certificate-seal"><span>CX</span></div>
          <div>
            <StatusBadge status={status} />
            <h3>{certificate.title}</h3>
            <p>{certificate.program}</p>
          </div>
        </div>
        <div className="detail-grid">
          <Detail label="Recipient" value={certificate.recipientName} />
          <Detail label="Recipient email" value={certificate.recipientEmail} />
          <Detail label="Issuing institution" value={certificate.institution} />
          <Detail label="Certificate ID" value={certificate.id} mono />
          <Detail label="Issue date" value={formatDate(certificate.issuedAt)} />
          <Detail label="Expiry date" value={formatDate(certificate.expiresAt)} />
          {certificate.revocationReason && (
            <Detail label="Revocation reason" value={certificate.revocationReason} />
          )}
        </div>
        <div className="detail-bottom">
          <div className="qr-card">
            <QRCodeSVG value={link} size={104} level="M" includeMargin />
            <span>Demo verification link</span>
          </div>
          <div className="detail-actions">
            <button className="button button-secondary" type="button" onClick={() => downloadDemoCertificate(certificate)}>
              <Download size={16} /> Download demo record
            </button>
            <button className="button button-secondary" type="button" onClick={copyLink}>
              <Copy size={16} /> {copied ? "Link copied" : "Copy verification link"}
            </button>
            <button className="button button-secondary" type="button" onClick={() => onVerify(certificate.id)}>
              <ExternalLink size={16} /> Open verification
            </button>
            {status === "active" && (
              <button className="button button-danger-quiet" type="button" onClick={() => onRevoke(certificate)}>
                Revoke demo record
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function Detail({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="detail-item">
      <span>{label}</span>
      <strong className={mono ? "id-code" : undefined}>{value}</strong>
    </div>
  );
}
