export type CertificateRecordStatus = "active" | "revoked";
export type CertificateStatus = CertificateRecordStatus | "expired";

export interface Certificate {
  id: string;
  recipientName: string;
  recipientEmail: string | null;
  title: string;
  program: string;
  institution: string;
  issuedAt: string;
  expiresAt: string | null;
  status: CertificateRecordStatus;
  documentName: string | null;
  revocationReason: string | null;
  revokedAt: string | null;
  revocationTransactionReference: string | null;
}

export interface NewCertificate {
  recipientName: string;
  recipientEmail: string;
  title: string;
  program: string;
  institution: string;
  issuedAt: string;
  expiresAt: string | null;
  documentName: string | null;
}

export interface CertificateMetadataUpdate {
  title?: string;
  program?: string;
  institution?: string;
  expiresAt?: string | null;
}
