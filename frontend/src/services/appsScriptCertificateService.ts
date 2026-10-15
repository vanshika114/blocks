import type {
  Certificate,
  CertificateMetadataUpdate,
  NewCertificate,
} from "../types/certificate";
import type { CertificateService } from "./certificateService";

type ApiOperation = "create" | "list" | "get" | "update" | "revoke";

interface ApiRevocation {
  reason: string;
  recordedAt: string;
  storage: "off_chain_metadata";
  transactionReference: string | null;
  transactionReferenceVerified: false;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function mapCertificate(value: unknown): Certificate {
  if (!isRecord(value)) {
    throw new Error("Apps Script returned an invalid certificate record.");
  }
  const fields = ["id", "recipientName", "title", "program", "institution", "issuedAt"];
  if (
    fields.some((field) => typeof value[field] !== "string") ||
    !/^CX-\d{4}-[A-F0-9]{8}$/.test(value.id as string) ||
    !isDate(value.issuedAt) ||
    (value.status !== "active" && value.status !== "revoked") ||
    (value.expiresAt !== null && !isDate(value.expiresAt))
  ) {
    throw new Error("Apps Script returned a certificate with an invalid schema.");
  }

  const revocation = value.revocation;
  let parsedRevocation: ApiRevocation | null = null;
  if (
    revocation !== null &&
    (!isRecord(revocation) ||
      typeof revocation.reason !== "string" ||
      typeof revocation.recordedAt !== "string" ||
      Number.isNaN(Date.parse(revocation.recordedAt)) ||
      revocation.storage !== "off_chain_metadata" ||
      (revocation.transactionReference !== null &&
        typeof revocation.transactionReference !== "string") ||
      revocation.transactionReferenceVerified !== false)
  ) {
    throw new Error("Apps Script returned invalid revocation metadata.");
  }
  if ((value.status === "revoked") !== (revocation !== null)) {
    throw new Error("Apps Script returned inconsistent certificate status metadata.");
  }
  if (isRecord(revocation)) {
    parsedRevocation = {
      reason: revocation.reason as string,
      recordedAt: revocation.recordedAt as string,
      storage: "off_chain_metadata",
      transactionReference: revocation.transactionReference as string | null,
      transactionReferenceVerified: false,
    };
  }

  return {
    id: value.id as string,
    recipientName: value.recipientName as string,
    recipientEmail: null,
    title: value.title as string,
    program: value.program as string,
    institution: value.institution as string,
    issuedAt: value.issuedAt as string,
    expiresAt: value.expiresAt as string | null,
    status: value.status as "active" | "revoked",
    documentName: null,
    revocationReason: parsedRevocation?.reason ?? null,
    revokedAt: parsedRevocation?.recordedAt.slice(0, 10) ?? null,
    revocationTransactionReference: parsedRevocation?.transactionReference ?? null,
  };
}

export class AppsScriptCertificateService implements CertificateService {
  readonly mode = "apps-script" as const;

  constructor(private readonly endpoint: string) {}

  async listCertificates(): Promise<Certificate[]> {
    const certificates: Certificate[] = [];
    let offset = 0;

    while (true) {
      const result: unknown = await this.request("list", { limit: 100, offset });
      if (
        !isRecord(result) ||
        !Array.isArray(result.items) ||
        !Number.isSafeInteger(result.total) ||
        (result.total as number) < 0 ||
        (result.nextOffset !== null && !Number.isSafeInteger(result.nextOffset))
      ) {
        throw new Error("Apps Script returned an invalid paginated list.");
      }
      certificates.push(...result.items.map(mapCertificate));
      if (result.nextOffset === null) {
        return certificates;
      }
      if (
        typeof result.nextOffset !== "number" ||
        result.nextOffset <= offset ||
        result.nextOffset > (result.total as number)
      ) {
        throw new Error("Apps Script returned an invalid pagination cursor.");
      }
      offset = result.nextOffset;
    }
  }

  async getCertificate(id: string): Promise<Certificate | null> {
    try {
      const result: unknown = await this.request("get", { id });
      return mapCertificate(this.certificateFromResult(result));
    } catch (error) {
      if (error instanceof AppsScriptApiError && error.code === "NOT_FOUND") {
        return null;
      }
      throw error;
    }
  }

  async createCertificate(input: NewCertificate): Promise<Certificate> {
    const result = await this.request("create", {
      certificate: {
        recipientName: input.recipientName,
        title: input.title,
        program: input.program,
        institution: input.institution,
        issuedAt: input.issuedAt,
        expiresAt: input.expiresAt,
      },
    });
    return mapCertificate(this.certificateFromResult(result));
  }

  async updateOffChainMetadata(
    id: string,
    update: CertificateMetadataUpdate,
  ): Promise<Certificate> {
    const result = await this.request("update", {
      id,
      metadata: update,
    });
    return mapCertificate(this.certificateFromResult(result));
  }

  async revokeCertificate(id: string, reason: string): Promise<Certificate> {
    const result = await this.request("revoke", {
      id,
      reason,
    });
    return mapCertificate(this.certificateFromResult(result));
  }

  private certificateFromResult(result: unknown): unknown {
    if (!isRecord(result) || !("certificate" in result)) {
      throw new Error("Apps Script returned an invalid certificate response.");
    }
    return result.certificate;
  }

  private async request(
    operation: ApiOperation,
    payload: Record<string, unknown>,
  ): Promise<unknown> {
    let parsedEndpoint: URL;
    try {
      parsedEndpoint = new URL(this.endpoint);
    } catch {
      throw new Error("VITE_CERTIFICATE_API_URL must be an absolute HTTPS URL.");
    }
    if (parsedEndpoint.protocol !== "https:") {
      throw new Error("VITE_CERTIFICATE_API_URL must use HTTPS.");
    }

    let response: Response;
    try {
      response = await fetch(this.endpoint, {
        method: "POST",
        mode: "cors",
        credentials: "include",
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body: JSON.stringify({ version: 1, operation, payload }),
      });
    } catch {
      throw new Error(
        "Could not reach the Apps Script API. Check the deployment URL, Google sign-in, access policy, and browser CORS behavior.",
      );
    }

    let envelope: unknown;
    try {
      envelope = await response.json();
    } catch {
      throw new Error(
        `Apps Script returned a non-JSON response (HTTP ${response.status}). Check the web-app deployment and access policy.`,
      );
    }
    if (!response.ok) {
      throw new Error(`Apps Script request failed with HTTP ${response.status}.`);
    }
    if (!isRecord(envelope) || typeof envelope.ok !== "boolean") {
      throw new Error("Apps Script returned an invalid API envelope.");
    }
    if (!envelope.ok) {
      if (
        !isRecord(envelope.error) ||
        typeof envelope.error.code !== "string" ||
        typeof envelope.error.message !== "string"
      ) {
        throw new Error("Apps Script returned an invalid API error.");
      }
      throw new AppsScriptApiError(envelope.error.code, envelope.error.message);
    }
    if (!("data" in envelope)) {
      throw new Error("Apps Script returned an empty success response.");
    }
    return envelope.data;
  }
}

class AppsScriptApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AppsScriptApiError";
  }
}
