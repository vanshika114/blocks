import type { ReactNode } from "react";
import {
  BadgeCheck,
  Bell,
  ChevronDown,
  CircleHelp,
  FileCheck2,
  FilePlus2,
  LayoutDashboard,
  SearchCheck,
  Settings2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export type AppPage = "dashboard" | "issue" | "verify" | "registry" | "settings";

const navigation: { id: AppPage; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Overview", icon: LayoutDashboard },
  { id: "issue", label: "Issue certificate", icon: FilePlus2 },
  { id: "verify", label: "Verify a certificate", icon: SearchCheck },
  { id: "registry", label: "Certificate registry", icon: FileCheck2 },
];

interface AppShellProps {
  page: AppPage;
  onNavigate: (page: AppPage) => void;
  children: ReactNode;
}

export function AppShell({ page, onNavigate, children }: AppShellProps) {
  const pageTitle = {
    dashboard: "Overview",
    issue: "Issue certificate",
    verify: "Verify a certificate",
    registry: "Certificate registry",
    settings: "Institution settings",
  }[page];

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <button className="brand-lockup" type="button" onClick={() => onNavigate("dashboard")} aria-label="CertifyX home">
          <span className="brand-mark"><BadgeCheck size={22} strokeWidth={1.8} /></span>
          <span className="brand-word">certify<span>x</span></span>
        </button>
        <div className="sidebar-label">WORKSPACE</div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          {navigation.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`nav-link ${page === id ? "nav-link-active" : ""}`}
              type="button"
              onClick={() => onNavigate(id)}
              aria-current={page === id ? "page" : undefined}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
              {id === "verify" && <span className="nav-link-dot" aria-hidden="true" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-grow" />
        <div className="sidebar-help">
          <span className="help-icon"><CircleHelp size={17} /></span>
          <div><strong>Need a hand?</strong><small>Explore the demo workspace</small></div>
          <ChevronDown size={15} />
        </div>
        <button className={`nav-link settings-link ${page === "settings" ? "nav-link-active" : ""}`} type="button" onClick={() => onNavigate("settings")} aria-current={page === "settings" ? "page" : undefined}>
          <Settings2 size={18} strokeWidth={1.8} /><span>Settings</span>
        </button>
        <div className="profile-switcher">
          <span className="profile-avatar">N</span>
          <span className="profile-meta"><strong>Northbridge University</strong><small>Demo institution</small></span>
          <ChevronDown size={15} />
        </div>
      </aside>

      <main className="main-column">
        <header className="topbar">
          <div className="breadcrumbs"><span>Workspace</span><span className="crumb-slash">/</span><strong>{pageTitle}</strong></div>
          <div className="topbar-actions">
            <span className="environment-pill"><span /> DEMO MODE · MOCK DATA</span>
            <button className="icon-button notification-button" type="button" aria-label="Notifications are demo-only" title="Notifications are demo-only">
              <Bell size={18} /><i aria-hidden="true" />
            </button>
            <span className="topbar-avatar">N</span>
          </div>
        </header>
        <div className="onchain-banner">
          <ShieldCheck size={16} />
          <span><strong>Demo workspace</strong> · Records are stored in memory only. Blockchain verification is not connected.</span>
          <Sparkles size={15} className="banner-sparkle" />
        </div>
        <div className="page-content">{children}</div>
        <footer className="app-footer">
          <span>© 2026 CertifyX · Frontend demonstration</span>
          <span><span className="footer-dot" /> No blockchain connection</span>
        </footer>
      </main>
    </div>
  );
}
