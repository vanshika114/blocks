import type {
  Certificate,
  CertificateMetadataUpdate,
  NewCertificate,
} from "../types/certificate";

export interface CertificateService {
  readonly mode: "mock" | "apps-script";
  listCertificates(): Promise<Certificate[]>;
  getCertificate(id: string): Promise<Certificate | null>;
  createCertificate(input: NewCertificate): Promise<Certificate>;
  updateOffChainMetadata(
    id: string,
    update: CertificateMetadataUpdate,
  ): Promise<Certificate>;
  revokeCertificate(id: string, reason: string): Promise<Certificate>;
}
