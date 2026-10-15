import type { CertificateService } from "./certificateService";
import { AppsScriptCertificateService } from "./appsScriptCertificateService";
import { certificateService as mockCertificateService } from "./mockCertificateService";

const endpoint = import.meta.env.VITE_CERTIFICATE_API_URL?.trim();

export const certificateService: CertificateService = endpoint
  ? new AppsScriptCertificateService(endpoint)
  : mockCertificateService;
