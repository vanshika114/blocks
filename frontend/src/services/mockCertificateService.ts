import { mockCertificates } from "../data/mockCertificates";
import type {
  Certificate,
  CertificateMetadataUpdate,
  NewCertificate,
} from "../types/certificate";
import type { CertificateService } from "./certificateService";

function createId(): string {
  const suffix =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replaceAll("-", "").slice(0, 8)
      : Math.random().toString(36).slice(2, 10).toUpperCase();
  return `CX-${new Date().getFullYear()}-${suffix.toUpperCase()}`;
}

function requiredRecord(records: Certificate[], id: string): Certificate {
  const record = records.find((certificate) => certificate.id === id);
  if (!record) {
    throw new Error(`Certificate ${id} was not found.`);
  }
  return record;
}

class InMemoryCertificateService implements CertificateService {
  readonly mode = "mock" as const;
  private records = mockCertificates.map((certificate) => ({ ...certificate }));

  async listCertificates(): Promise<Certificate[]> {
    return this.records.map((certificate) => ({ ...certificate }));
  }

  async getCertificate(id: string): Promise<Certificate | null> {
    const record = this.records.find(
      (certificate) => certificate.id.toLowerCase() === id.trim().toLowerCase(),
    );
    return record ? { ...record } : null;
  }

  async createCertificate(input: NewCertificate): Promise<Certificate> {
    let id = createId();
    while (this.records.some((certificate) => certificate.id === id)) {
      id = createId();
    }

    const certificate: Certificate = {
      ...input,
      id,
      status: "active",
      revocationReason: null,
      revokedAt: null,
      revocationTransactionReference: null,
    };
    this.records = [certificate, ...this.records];
    return { ...certificate };
  }

  async updateOffChainMetadata(
    id: string,
    update: CertificateMetadataUpdate,
  ): Promise<Certificate> {
    const record = requiredRecord(this.records, id);
    Object.assign(record, update);
    return { ...record };
  }

  async revokeCertificate(id: string, reason: string): Promise<Certificate> {
    const record = requiredRecord(this.records, id);
    if (record.status === "revoked") {
      throw new Error("This certificate has already been revoked.");
    }
    if (!reason.trim()) {
      throw new Error("A reason is required to revoke a certificate.");
    }

    record.status = "revoked";
    record.revocationReason = reason.trim();
    record.revokedAt = new Date().toISOString().slice(0, 10);
    record.revocationTransactionReference = null;
    return { ...record };
  }
}

export const certificateService: CertificateService =
  new InMemoryCertificateService();
