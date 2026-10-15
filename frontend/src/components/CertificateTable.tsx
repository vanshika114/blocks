import { ArrowUpRight, Download, Eye } from "lucide-react";

import { downloadDemoCertificate, formatDate, getCertificateStatus } from "../lib/certificateUtils";
import type { Certificate } from "../types/certificate";
import { StatusBadge } from "./StatusBadge";

interface CertificateTableProps {
  certificates: Certificate[];
  onView: (certificate: Certificate) => void;
  onVerify: (id: string) => void;
  compact?: boolean;
}

export function CertificateTable({
  certificates,
  onView,
  onVerify,
  compact = false,
}: CertificateTableProps) {
  return (
    <div className="table-scroll">
      <table className="certificate-table">
        <thead>
          <tr>
            <th scope="col">Recipient</th>
            <th scope="col">Certificate</th>
            <th scope="col">Issued</th>
            <th scope="col">Status</th>
            {!compact && <th scope="col">Certificate ID</th>}
            <th scope="col"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {certificates.map((certificate) => (
            <tr key={certificate.id}>
              <td>
                <div className="recipient-cell">
                  <span className="avatar">{certificate.recipientName.charAt(0)}</span>
                  <span>
                    <strong>{certificate.recipientName}</strong>
                    <small>{certificate.institution}</small>
                  </span>
                </div>
              </td>
              <td>
                <strong>{certificate.title}</strong>
                <small className="table-subtitle">{certificate.program}</small>
              </td>
              <td className="date-cell">{formatDate(certificate.issuedAt)}</td>
              <td><StatusBadge status={getCertificateStatus(certificate)} /></td>
              {!compact && <td><code className="id-code">{certificate.id}</code></td>}
              <td>
                <div className="row-actions">
                  <button className="icon-button" type="button" onClick={() => onView(certificate)} aria-label={`View ${certificate.id}`} title="View details">
                    <Eye size={16} />
                  </button>
                  <button className="icon-button" type="button" onClick={() => downloadDemoCertificate(certificate)} aria-label={`Download demo record ${certificate.id}`} title="Download demo certificate">
                    <Download size={16} />
                  </button>
                  <button className="icon-button" type="button" onClick={() => onVerify(certificate.id)} aria-label={`Verify ${certificate.id}`} title="Open verification">
                    <ArrowUpRight size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
