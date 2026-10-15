import { Check, CircleHelp, Clock3, X } from "lucide-react";

import type { CertificateStatus } from "../types/certificate";

const labels: Record<CertificateStatus | "unknown", string> = {
  active: "Active",
  revoked: "Revoked",
  expired: "Expired",
  unknown: "Not found",
};

export function StatusBadge({ status }: { status: CertificateStatus | "unknown" }) {
  const Icon = status === "active"
    ? Check
    : status === "expired"
      ? Clock3
      : status === "unknown"
        ? CircleHelp
        : X;
  return (
    <span className={`status-badge status-${status}`}>
      <Icon size={13} strokeWidth={2.2} aria-hidden="true" />
      {labels[status]}
    </span>
  );
}
