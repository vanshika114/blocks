import { useState } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

import { AppShell, type AppPage } from "./components/AppShell";
import { CertificateDetailsModal } from "./components/CertificateDetailsModal";
import { RevokeModal } from "./components/RevokeModal";
import { certificateService } from "./services/mockCertificateService";
import type { Certificate, NewCertificate } from "./types/certificate";
import { DashboardPage } from "./pages/DashboardPage";
import { IssuePage } from "./pages/IssuePage";
import { RegistryPage } from "./pages/RegistryPage";
import { SettingsPage } from "./pages/SettingsPage";
import { VerifyPage } from "./pages/VerifyPage";

type Toast = { type: "success" | "error"; message: string };

function initialVerifyId(): string {
  return new URLSearchParams(window.location.search).get("verify")?.trim() ?? "";
}

export default function App() {
  const [certificates, setCertificates] = useState(() => certificateService.listCertificates());
  const [verifyId, setVerifyId] = useState(initialVerifyId);
  const [page, setPage] = useState<AppPage>(() => initialVerifyId() ? "verify" : "dashboard");
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<Certificate | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [institutionName, setInstitutionName] = useState("Northbridge University");
  const [toast, setToast] = useState<Toast | null>(null);

  function showToast(nextToast: Toast) {
    setToast(nextToast);
    window.setTimeout(() => setToast(null), 3600);
  }

  function updateSnapshot() {
    setCertificates(certificateService.listCertificates());
  }

  function navigate(nextPage: AppPage) {
    setPage(nextPage);
    setSelectedCertificate(null);
    if (nextPage !== "verify") {
      setVerifyId("");
      window.history.replaceState(null, "", window.location.pathname);
    } else {
      setVerifyId("");
      window.history.replaceState(null, "", window.location.pathname);
    }
  }

  function openVerification(id: string) {
    const normalizedId = id.trim();
    setVerifyId(normalizedId);
    setPage("verify");
    setSelectedCertificate(null);
    const url = new URL(window.location.href);
    url.search = new URLSearchParams({ verify: normalizedId }).toString();
    window.history.pushState(null, "", url);
  }

  function createCertificate(input: NewCertificate): Certificate {
    const certificate = certificateService.createCertificate(input);
    updateSnapshot();
    showToast({ type: "success", message: "Demo certificate record created." });
    return certificate;
  }

  function requestRevocation(certificate: Certificate) {
    setSelectedCertificate(null);
    setRevokeTarget(certificate);
  }

  function confirmRevocation(reason: string) {
    if (!revokeTarget) return;
    try {
      certificateService.revokeCertificate(revokeTarget.id, reason);
      updateSnapshot();
      setRevokeTarget(null);
      showToast({ type: "success", message: "Certificate marked revoked in local demo data." });
    } catch (error) {
      showToast({
        type: "error",
        message: error instanceof Error ? error.message : "The demo record could not be revoked.",
      });
    }
  }

  const pageContent = (() => {
    switch (page) {
      case "issue":
        return <IssuePage defaultInstitution={institutionName} onIssue={createCertificate} onVerify={openVerification} onView={setSelectedCertificate} />;
      case "verify":
        return <VerifyPage certificates={certificates} initialId={verifyId} onSearchId={openVerification} onView={setSelectedCertificate} />;
      case "registry":
        return <RegistryPage certificates={certificates} onView={setSelectedCertificate} onVerify={openVerification} />;
      case "settings":
        return <SettingsPage
          institutionName={institutionName}
          onInstitutionNameChange={setInstitutionName}
          notificationsEnabled={notificationsEnabled}
          onNotificationsChange={setNotificationsEnabled}
        />;
      case "dashboard":
        return <DashboardPage certificates={certificates} onNavigate={navigate} onView={setSelectedCertificate} onVerify={openVerification} />;
    }
  })();

  return (
    <AppShell page={page} onNavigate={navigate} notificationsEnabled={notificationsEnabled}>
      {pageContent}
      {selectedCertificate && (
        <CertificateDetailsModal
          certificate={selectedCertificate}
          onClose={() => setSelectedCertificate(null)}
          onRevoke={requestRevocation}
          onVerify={openVerification}
        />
      )}
      {revokeTarget && (
        <RevokeModal
          certificate={revokeTarget}
          onClose={() => setRevokeTarget(null)}
          onConfirm={confirmRevocation}
        />
      )}
      {toast && (
        <div className={`toast toast-${toast.type}`} role={toast.type === "error" ? "alert" : "status"} aria-live="polite">
          {toast.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
          <button type="button" onClick={() => setToast(null)} aria-label="Dismiss notification"><X size={16} /></button>
        </div>
      )}
    </AppShell>
  );
}
