import { useState, type FormEvent } from "react";
import { AlertTriangle, X } from "lucide-react";

import type { Certificate } from "../types/certificate";

export function RevokeModal({
  certificate,
  onClose,
  onConfirm,
}: {
  certificate: Certificate;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (reason.trim().length < 8) {
      setError("Please enter a reason with at least 8 characters.");
      return;
    }
    onConfirm(reason.trim());
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="revoke-modal" role="dialog" aria-modal="true" aria-labelledby="revoke-title">
        <div className="modal-heading">
          <div className="danger-heading-icon"><AlertTriangle size={20} /></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close revocation dialog">
            <X size={18} />
          </button>
        </div>
        <h2 id="revoke-title">Revoke this certificate?</h2>
        <p className="muted-copy">
          <strong>{certificate.recipientName}</strong> · {certificate.title}
        </p>
        <div className="demo-notice compact-notice">
          <AlertTriangle size={16} />
          <span>This changes local demo state only. No blockchain transaction will be sent.</span>
        </div>
        <form onSubmit={submit}>
          <label className="field-label" htmlFor="revoke-reason">Reason for revocation</label>
          <textarea
            id="revoke-reason"
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              setError("");
            }}
            placeholder="Briefly explain why this record is being revoked"
            rows={3}
            maxLength={240}
            required
          />
          {error && <p className="field-error" role="alert">{error}</p>}
          <div className="modal-actions">
            <button className="button button-secondary" type="button" onClick={onClose}>Cancel</button>
            <button className="button button-danger" type="submit">Confirm revocation</button>
          </div>
        </form>
      </section>
    </div>
  );
}
