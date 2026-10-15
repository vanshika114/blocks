import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

import { AppShell, type AppPage } from "./components/AppShell";
import { CertificateDetailsModal } from "./components/CertificateDetailsModal";
import { RevokeModal } from "./components/RevokeModal";
import { certificateService } from "./services/configuredCertificateService";
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
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [serviceLoadError, setServiceLoadError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);
  const [verifyId, setVerifyId] = useState(initialVerifyId);
  const [page, setPage] = useState<AppPage>(() => initialVerifyId() ? "verify" : "dashboard");
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<Certificate | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [institutionName, setInstitutionName] = useState("Northbridge University");
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    let current = true;
    setIsLoading(true);
    setServiceLoadError("");
    certificateService
      .listCertificates()
      .then((records) => {
        if (current) setCertificates(records);
      })
      .catch((error: unknown) => {
        if (current) {
          setServiceLoadError(
            error instanceof Error ? error.message : "Certificate records could not be loaded.",
          );
        }
      })
      .finally(() => {
        if (current) setIsLoading(false);
      });
    return () => {
      current = false;
    };
  }, [reloadToken]);

  function showToast(nextToast: Toast) {
    setToast(nextToast);
    window.setTimeout(() => setToast(null), 3600);
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

  async function createCertificate(input: NewCertificate): Promise<Certificate> {
    const certificate = await certificateService.createCertificate(input);
    setCertificates((current) => [
      certificate,
      ...current.filter((record) => record.id !== certificate.id),
    ]);
    showToast({
      type: "success",
      message:
        certificateService.mode === "mock"
          ? "Demo certificate record created."
          : "Off-chain certificate metadata saved. No blockchain transaction occurred.",
    });
    return certificate;
  }

  function requestRevocation(certificate: Certificate) {
    setSelectedCertificate(null);
    setRevokeTarget(certificate);
  }

  async function confirmRevocation(reason: string): Promise<void> {
    if (!revokeTarget) return;
    const revoked = await certificateService.revokeCertificate(revokeTarget.id, reason);
    setCertificates((current) =>
      current.map((record) => (record.id === revoked.id ? revoked : record)),
    );
    setRevokeTarget(null);
    showToast({
      type: "success",
      message:
        certificateService.mode === "mock"
          ? "Certificate marked revoked in local demo data."
          : "Off-chain revocation metadata saved. No blockchain transaction occurred.",
    });
  }

  const pageContent = (() => {
    switch (page) {
      case "issue":
        return <IssuePage storageMode={certificateService.mode} defaultInstitution={institutionName} onIssue={createCertificate} onVerify={openVerification} onView={setSelectedCertificate} />;
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
          storageMode={certificateService.mode}
        />;
      case "dashboard":
        return <DashboardPage certificates={certificates} onNavigate={navigate} onView={setSelectedCertificate} onVerify={openVerification} />;
    }
  })();

  return (
    <AppShell page={page} onNavigate={navigate} notificationsEnabled={notificationsEnabled} storageMode={certificateService.mode}>
      {isLoading ? (
        <div className="service-state" role="status">Loading certificate metadata…</div>
      ) : serviceLoadError ? (
        <div className="service-state service-state-error" role="alert">
          <strong>Certificate service unavailable</strong>
          <span>{serviceLoadError}</span>
          <button className="button button-secondary" type="button" onClick={() => setReloadToken((value) => value + 1)}>Retry</button>
        </div>
      ) : pageContent}
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
          storageMode={certificateService.mode}
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
