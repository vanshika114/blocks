import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  FileCheck2,
  FilePlus2,
  SearchCheck,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";

import { CertificateTable } from "../components/CertificateTable";
import { formatDate, getCertificateStatus } from "../lib/certificateUtils";
import type { AppPage } from "../components/AppShell";
import type { Certificate } from "../types/certificate";

interface DashboardPageProps {
  certificates: Certificate[];
  onNavigate: (page: AppPage) => void;
  onView: (certificate: Certificate) => void;
  onVerify: (id: string) => void;
}

export function DashboardPage({
  certificates,
  onNavigate,
  onView,
  onVerify,
}: DashboardPageProps) {
  const today = new Date();
  const greeting = today.getHours() < 12 ? "Good morning" : today.getHours() < 18 ? "Good afternoon" : "Good evening";
  const dateLabel = new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(today).toUpperCase();
  const active = certificates.filter((certificate) => getCertificateStatus(certificate) === "active").length;
  const revoked = certificates.filter((certificate) => certificate.status === "revoked").length;
  const thisMonth = certificates.filter((certificate) => certificate.issuedAt.slice(0, 7) === new Date().toISOString().slice(0, 7)).length;
  const recent = [...certificates].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt)).slice(0, 5);

  return (
    <>
      <section className="welcome-row">
        <div>
          <span className="eyebrow">{dateLabel}</span>
          <h1>{greeting}, Northbridge <span className="wave">✳</span></h1>
          <p>Here&apos;s what&apos;s happening with your credentials today.</p>
        </div>
        <button className="button button-primary" type="button" onClick={() => onNavigate("issue")}>
          <FilePlus2 size={17} /> Issue a certificate
        </button>
      </section>

      <section className="stat-grid" aria-label="Certificate statistics">
        <StatCard
          icon={<FileCheck2 size={18} />}
          label="Total issued"
          value={certificates.length}
          note="All records in this demo"
          accent="gold"
        />
        <StatCard
          icon={<BadgeCheck size={18} />}
          label="Active certificates"
          value={active}
          note="Not revoked or expired"
          accent="green"
          trend={<><ArrowUpRight size={14} /> {thisMonth} this month</>}
        />
        <StatCard
          icon={<ShieldAlert size={18} />}
          label="Revoked"
          value={revoked}
          note="Local demo status only"
          accent="red"
        />
        <StatCard
          icon={<Sparkles size={18} />}
          label="Verifications"
          value="—"
          note="Live verification not connected"
          accent="ink"
        />
      </section>

      <section className="dashboard-grid">
        <div className="panel trend-panel">
          <div className="panel-heading">
            <div><h2>Issuance activity</h2><p>Certificates issued over the last six months</p></div>
            <span className="chart-legend"><i /> Issued</span>
          </div>
          <IssuanceChart certificates={certificates} />
        </div>
        <div className="panel quick-panel">
          <div className="panel-heading">
            <div><h2>Quick actions</h2><p>Keep your credential workflow moving</p></div>
          </div>
          <button className="quick-action" type="button" onClick={() => onNavigate("issue")}>
            <span className="quick-icon quick-icon-gold"><FilePlus2 size={18} /></span>
            <span><strong>Issue a certificate</strong><small>Create a new demo credential</small></span>
            <ArrowRight size={16} />
          </button>
          <button className="quick-action" type="button" onClick={() => onNavigate("verify")}>
            <span className="quick-icon quick-icon-green"><SearchCheck size={18} /></span>
            <span><strong>Verify a certificate</strong><small>Check a record in the demo registry</small></span>
            <ArrowRight size={16} />
          </button>
          <div className="quick-footnote"><ShieldAlert size={14} /> Mock status only — no on-chain proof</div>
        </div>
      </section>

      <section className="panel recent-panel">
        <div className="panel-heading recent-heading">
          <div><h2>Recent certificates</h2><p>Your latest issued credentials at a glance</p></div>
          <button className="text-button" type="button" onClick={() => onNavigate("registry")}>
            View registry <ArrowRight size={15} />
          </button>
        </div>
        {recent.length ? (
          <CertificateTable certificates={recent} compact onView={onView} onVerify={onVerify} />
        ) : (
          <EmptyRecords onIssue={() => onNavigate("issue")} />
        )}
      </section>
    </>
  );
}

function StatCard({
  icon,
  label,
  value,
  note,
  accent,
  trend,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  note: string;
  accent: string;
  trend?: ReactNode;
}) {
  return (
    <article className="stat-card">
      <div className="stat-top"><span className={`stat-icon stat-icon-${accent}`}>{icon}</span>{trend && <span className="stat-trend">{trend}</span>}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-note">{note}</div>
    </article>
  );
}

function IssuanceChart({ certificates }: { certificates: Certificate[] }) {
  const today = new Date();
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() - (5 - index), 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    return {
      label: new Intl.DateTimeFormat("en", { month: "short" }).format(date),
      count: certificates.filter((certificate) => certificate.issuedAt.startsWith(key)).length,
    };
  });
  const max = Math.max(1, ...months.map((month) => month.count));

  return (
    <div className="chart-wrap" role="img" aria-label={`Issuance activity for the last six months: ${months.map((month) => `${month.label} ${month.count}`).join(", ")}`}>
      <div className="chart-y-labels"><span>{max}</span><span>{Math.ceil(max / 2)}</span><span>0</span></div>
      <div className="chart-area">
        <div className="chart-guides"><i /><i /><i /></div>
        <div className="chart-bars">
          {months.map((month, index) => (
            <div className="chart-column" key={month.label}>
              <span className="chart-count">{month.count || ""}</span>
              <div className={`chart-bar ${index === months.length - 1 ? "chart-bar-current" : ""}`} style={{ height: `${Math.max(4, (month.count / max) * 100)}%` }} />
              <span className="chart-month">{month.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyRecords({ onIssue }: { onIssue: () => void }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><FileCheck2 size={23} /></div>
      <h3>No certificates yet</h3>
      <p>Your newly issued demo certificates will appear here.</p>
      <button className="button button-secondary" type="button" onClick={onIssue}>Issue your first certificate</button>
    </div>
  );
}

export function ActivityLabel({ certificate }: { certificate: Certificate }) {
  return (
    <span className="activity-label">
      {certificate.status === "revoked" ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
      {certificate.status === "revoked" ? "Revoked" : "Issued"} · {formatDate(certificate.status === "revoked" && certificate.revokedAt ? certificate.revokedAt : certificate.issuedAt)}
    </span>
  );
}
