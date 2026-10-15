import { useState, type ChangeEvent, type FormEvent } from "react";
import { AlertCircle, Check, FileUp, Info, QrCode, Sparkles } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import { formatDate, verificationUrl } from "../lib/certificateUtils";
import type { Certificate, NewCertificate } from "../types/certificate";

interface IssuePageProps {
  storageMode: "mock" | "apps-script";
  defaultInstitution: string;
  onIssue: (input: NewCertificate) => Promise<Certificate>;
  onVerify: (id: string) => void;
  onView: (certificate: Certificate) => void;
}

function localToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function IssuePage({ storageMode, defaultInstitution, onIssue, onVerify, onView }: IssuePageProps) {
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [title, setTitle] = useState("");
  const [program, setProgram] = useState("");
  const [institution, setInstitution] = useState(defaultInstitution);
  const [issuedAt, setIssuedAt] = useState(localToday());
  const [expiresAt, setExpiresAt] = useState("");
  const [documentName, setDocumentName] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<Certificate | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError("");
    setCreated(null);

    if (new Date(`${issuedAt}T00:00:00`) > new Date(`${localToday()}T23:59:59`)) {
      setError("The issue date cannot be in the future.");
      return;
    }
    if (expiresAt && expiresAt <= issuedAt) {
      setError("The expiry date must be later than the issue date.");
      return;
    }

    setSubmitting(true);
    try {
      const certificate = onIssue({
        recipientName: recipientName.trim(),
        recipientEmail: recipientEmail.trim(),
        title: title.trim(),
        program: program.trim(),
        institution: institution.trim(),
        issuedAt,
        expiresAt: expiresAt || null,
        documentName,
      });
      setCreated(await certificate);
    } catch (issueError) {
      setError(issueError instanceof Error ? issueError.message : "The demo record could not be created.");
    } finally {
      setSubmitting(false);
    }
  }

  function chooseDocument(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setError("");
    if (!file) {
      setDocumentName(null);
      return;
    }
    const acceptedTypes = ["application/pdf", "image/png", "image/jpeg"];
    if (!acceptedTypes.includes(file.type)) {
      setError("Choose a PDF, PNG, or JPEG file.");
      event.target.value = "";
      setDocumentName(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("The demo upload limit is 5 MB.");
      event.target.value = "";
      setDocumentName(null);
      return;
    }
    setDocumentName(file.name);
  }

  return (
    <div className="form-page">
      <section className="page-intro">
        <div>
          <span className="eyebrow">CREDENTIAL MANAGEMENT</span>
          <h1>Issue a certificate</h1>
          <p>Create a credential record for a graduate, learner, or professional.</p>
        </div>
        <span className="step-chip"><Sparkles size={14} /> {storageMode === "mock" ? "Demo issuance" : "Off-chain metadata"}</span>
      </section>

      <div className="demo-notice">
        <Info size={17} />
        <span>{storageMode === "mock" ? <>This creates a <strong>local demo record only</strong>. It is not written to a blockchain and cannot be presented as cryptographic proof.</> : <>This saves <strong>off-chain metadata only</strong> to the configured spreadsheet. It does not issue or verify anything on-chain.</>}</span>
      </div>

      {created && (
        <section className="success-card" aria-live="polite">
          <div className="success-check"><Check size={20} /></div>
          <div className="success-copy">
            <span className="eyebrow">{storageMode === "mock" ? "DEMO RECORD CREATED" : "OFF-CHAIN METADATA SAVED"}</span>
            <h2>{created.title}</h2>
            <p>Issued to {created.recipientName} on {formatDate(created.issuedAt)}.</p>
            <code>{created.id}</code>
            <div className="success-actions">
              <button className="button button-secondary" type="button" onClick={() => onView(created)}>View certificate</button>
              <button className="button button-secondary" type="button" onClick={() => onVerify(created.id)}>Open verification</button>
            </div>
          </div>
          <div className="success-qr"><QRCodeSVG value={verificationUrl(created.id)} size={92} level="M" includeMargin /><span>Demo link</span></div>
        </section>
      )}

      <div className="issue-layout">
        <form className="panel issue-form" onSubmit={submit}>
          <div className="form-section-heading"><span className="section-number">01</span><div><h2>Recipient details</h2><p>Who is receiving this credential?</p></div></div>
          <div className="field-grid">
            <div className="field-group">
              <label className="field-label" htmlFor="recipient-name">Full name <span>*</span></label>
              <input id="recipient-name" autoComplete="name" value={recipientName} onChange={(event) => setRecipientName(event.target.value)} placeholder="e.g. Jordan Lee" minLength={2} maxLength={100} required />
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="recipient-email">Email address <span className="optional-mark">{storageMode === "mock" ? "*" : "Not stored"}</span></label>
              <input id="recipient-email" type="email" autoComplete="email" value={recipientEmail} onChange={(event) => setRecipientEmail(event.target.value)} placeholder={storageMode === "mock" ? "jordan@example.edu" : "Not sent to Google Sheets"} maxLength={254} required={storageMode === "mock"} />
            </div>
          </div>

          <div className="form-section-heading form-section-spaced"><span className="section-number">02</span><div><h2>Certificate information</h2><p>Set the achievement details and validity.</p></div></div>
          <div className="field-grid">
            <div className="field-group field-span-2">
              <label className="field-label" htmlFor="certificate-title">Certificate title <span>*</span></label>
              <input id="certificate-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Bachelor of Computer Science" minLength={2} maxLength={120} required />
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="certificate-program">Course, program, or achievement <span>*</span></label>
              <input id="certificate-program" value={program} onChange={(event) => setProgram(event.target.value)} placeholder="e.g. Computer Science" minLength={2} maxLength={120} required />
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="institution">Issuing institution <span>*</span></label>
              <input id="institution" value={institution} onChange={(event) => setInstitution(event.target.value)} placeholder="Institution name" minLength={2} maxLength={120} required />
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="issue-date">Issue date <span>*</span></label>
              <input id="issue-date" type="date" value={issuedAt} max={localToday()} onChange={(event) => setIssuedAt(event.target.value)} required />
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="expiry-date">Expiry date <span className="optional-mark">Optional</span></label>
              <input id="expiry-date" type="date" value={expiresAt} min={issuedAt || undefined} onChange={(event) => setExpiresAt(event.target.value)} />
            </div>
          </div>

          <div className="form-section-heading form-section-spaced"><span className="section-number">03</span><div><h2>Supporting document</h2><p>Optional attachment for this browser session.</p></div></div>
          <label className="upload-zone" htmlFor="certificate-document">
            <span className="upload-icon"><FileUp size={20} /></span>
            <span><strong>{documentName || "Choose a certificate file"}</strong><small>{documentName ? "File name only — no file is uploaded or saved" : "PDF, PNG, or JPEG · up to 5 MB · not uploaded"}</small></span>
            <span className="upload-browse">Browse</span>
            <input id="certificate-document" type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" onChange={chooseDocument} />
          </label>

          {error && <p className="form-error" role="alert"><AlertCircle size={16} />{error}</p>}
          <div className="form-submit-row">
            <span><Info size={14} /> {storageMode === "mock" ? "Demo mode. No transaction or file upload." : "Only certificate metadata is sent; email and documents are excluded."}</span>
            <button className="button button-primary" type="submit" disabled={submitting}><Sparkles size={16} /> {submitting ? "Saving…" : storageMode === "mock" ? "Create demo record" : "Save metadata record"}</button>
          </div>
        </form>

        <aside className="issue-aside">
          <div className="panel preview-panel">
            <div className="preview-topline"><span>PREVIEW</span><span className="preview-dot" /> LIVE</div>
            <div className="certificate-preview">
              <span className="preview-brand"><span className="preview-seal">CX</span> CERTIFYX</span>
              <div className="preview-rule" />
              <span className="preview-label">CERTIFICATE OF ACHIEVEMENT</span>
              <p className="preview-presented">This credential is presented to</p>
              <h3>{recipientName || "Recipient name"}</h3>
              <p>for completing</p>
              <h4>{title || "Certificate title"}</h4>
              <span className="preview-program">{program || "Course or program"}</span>
              <div className="preview-footer"><span>{institution || "Issuing institution"}</span><span>{issuedAt ? formatDate(issuedAt) : "Issue date"}</span></div>
            </div>
            <div className="preview-caption"><QrCode size={15} /> Preview only — generated after creating your demo record</div>
          </div>
          <div className="side-info-card">
            <div className="side-info-icon"><Info size={17} /></div>
            <div><strong>How this demo works</strong><p>Your record, status, and verification link live only in the browser&apos;s current session. Refreshing the page resets all changes.</p></div>
          </div>
        </aside>
      </div>
    </div>
  );
}
