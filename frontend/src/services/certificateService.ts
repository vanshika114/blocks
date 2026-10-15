import type {
  Certificate,
  CertificateMetadataUpdate,
  NewCertificate,
} from "../types/certificate";

export interface CertificateService {
  listCertificates(): Certificate[];
  getCertificate(id: string): Certificate | null;
  createCertificate(input: NewCertificate): Certificate;
  updateOffChainMetadata(
    id: string,
    update: CertificateMetadataUpdate,
  ): Certificate;
  revokeCertificate(id: string, reason: string): Certificate;
}
