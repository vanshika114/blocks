import { Check, Clock3, X } from "lucide-react";

import type { CertificateStatus } from "../types/certificate";

const labels: Record<CertificateStatus, string> = {
  active: "Active",
  revoked: "Revoked",
  expired: "Expired",
};

export function StatusBadge({ status }: { status: CertificateStatus }) {
  const Icon = status === "active" ? Check : status === "expired" ? Clock3 : X;
  return (
    <span className={`status-badge status-${status}`}>
      <Icon size={13} strokeWidth={2.2} aria-hidden="true" />
      {labels[status]}
    </span>
  );
}
