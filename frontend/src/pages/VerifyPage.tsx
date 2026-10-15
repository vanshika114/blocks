import { useEffect, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Clock3,
  FileQuestion,
  Search,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import { formatDate, getCertificateStatus, verificationUrl } from "../lib/certificateUtils";
import type { Certificate, CertificateStatus } from "../types/certificate";
import { StatusBadge } from "../components/StatusBadge";

interface VerifyPageProps {
  certificates: Certificate[];
  initialId: string;
  onSearchId: (id: string) => void;
  onView: (certificate: Certificate) => void;
}

export function VerifyPage({ certificates, initialId, onSearchId, onView }: VerifyPageProps) {
  const [query, setQuery] = useState(initialId);
  const [searchedId, setSearchedId] = useState(initialId.trim());
  const [error, setError] = useState("");
  const certificate = searchedId
    ? certificates.find((record) => record.id.toLowerCase() === searchedId.toLowerCase()) ?? null
    : null;

  useEffect(() => {
    setQuery(initialId);
    setSearchedId(initialId.trim());
  }, [initialId]);

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = query.trim();
    if (!id) {
      setError("Enter a certificate ID to search the demo registry.");
      setSearchedId("");
      return;
    }
    setError("");
    setSearchedId(id);
    onSearchId(id);
  }

  const status = certificate ? getCertificateStatus(certificate) : null;

  return (
    <div className="verify-page">
      <section className="page-intro verify-intro">
        <div><span className="eyebrow">PUBLIC CREDENTIAL LOOKUP</span><h1>Verify a certificate</h1><p>Check whether a certificate ID appears in this demo registry.</p></div>
      </section>
      <div className="verification-warning"><ShieldAlert size={18} /><span><strong>Demo lookup only.</strong> A matching record is not cryptographic proof of authenticity. No document hash or blockchain is checked.</span></div>

      <form className="verify-search panel" onSubmit={search}>
        <div className="search-field-wrap">
          <Search size={19} />
          <label htmlFor="certificate-search" className="sr-only">Certificate ID</label>
          <input id="certificate-search" value={query} onChange={(event) => { setQuery(event.target.value); setError(""); }} placeholder="Enter certificate ID, e.g. CX-2026-08421" autoCapitalize="characters" spellCheck={false} />
        </div>
        <button className="button button-primary" type="submit">Check record <Search size={16} /></button>
      </form>
      {error && <p className="field-error verify-error" role="alert">{error}</p>}
      <div className="verify-help"><span>TRY A SAMPLE ID</span>{certificates.slice(0, 3).map((record) => <button key={record.id} type="button" onClick={() => { setQuery(record.id); setSearchedId(record.id); setError(""); onSearchId(record.id); }}>{record.id}</button>)}</div>

      {!searchedId ? (
        <div className="verify-prompt panel">
          <div className="verify-prompt-icon"><Search size={23} /></div>
          <h2>Search the demo registry</h2>
          <p>Enter the ID printed on the certificate to view its current mock status.</p>
          <div className="verification-steps"><span><i>1</i> Enter certificate ID</span><span><i>2</i> Match a local record</span><span><i>3</i> Review demo status</span></div>
        </div>
      ) : certificate && status ? (
        <VerificationResult certificate={certificate} status={status} onView={onView} />
      ) : (
        <div className="result-card result-unknown" aria-live="polite">
          <div className="result-icon"><FileQuestion size={24} /></div>
          <div className="result-body"><StatusBadge status="expired" /><h2>No matching record found</h2><p><code>{searchedId}</code> does not appear in the current demo registry. Check the ID or ask the issuing institution to confirm the record.</p></div>
        </div>
      )}
    </div>
  );
}

function VerificationResult({
  certificate,
  status,
  onView,
}: {
  certificate: Certificate;
  status: CertificateStatus;
  onView: (certificate: Certificate) => void;
}) {
  const config = {
    active: {
      icon: <BadgeCheck size={24} />,
      className: "result-active",
      label: "Active demo record",
      heading: "Record found in demo registry",
      description: "The record exists in this local demo and is not marked as revoked or expired.",
    },
    revoked: {
      icon: <ShieldAlert size={24} />,
      className: "result-revoked",
      label: "Revoked demo record",
      heading: "This certificate is revoked",
      description: "The local demo record has been marked as revoked by the demo institution.",
    },
    expired: {
      icon: <Clock3 size={24} />,
      className: "result-expired",
      label: "Expired demo record",
      heading: "This certificate has expired",
      description: "The recorded expiry date has passed. This status is calculated from demo metadata.",
    },
  }[status];

  return (
    <section className={`verification-result panel ${config.className}`} aria-live="polite">
      <div className="result-header">
        <span className="result-large-icon">{config.icon}</span>
        <div><span className="eyebrow">{config.label}</span><h2>{config.heading}</h2><p>{config.description}</p></div>
        <StatusBadge status={status} />
      </div>
      <div className="result-record">
        <div className="result-record-main">
          <span className="eyebrow">CERTIFICATE HOLDER</span>
          <h3>{certificate.recipientName}</h3>
          <p>{certificate.title}</p>
          <dl className="result-details">
            <div><dt>Certificate ID</dt><dd><code>{certificate.id}</code></dd></div>
            <div><dt>Institution</dt><dd>{certificate.institution}</dd></div>
            <div><dt>Program</dt><dd>{certificate.program}</dd></div>
            <div><dt>Issue date</dt><dd>{formatDate(certificate.issuedAt)}</dd></div>
            <div><dt>Expiry date</dt><dd>{formatDate(certificate.expiresAt)}</dd></div>
            {certificate.revocationReason && <div><dt>Revocation reason</dt><dd>{certificate.revocationReason}</dd></div>}
          </dl>
        </div>
        <div className="result-qr"><QRCodeSVG value={verificationUrl(certificate.id)} size={104} level="M" includeMargin /><span>Local demo link</span></div>
      </div>
      <div className="result-footer">
        <span><AlertTriangle size={15} /> This result checks a mock record only — it is not a blockchain verification.</span>
        <button className="text-button" type="button" onClick={() => onView(certificate)}>View record details <ShieldCheck size={15} /></button>
      </div>
    </section>
  );
}
