import { useMemo, useState } from "react";
import { FileSearch, Search, SlidersHorizontal } from "lucide-react";

import { CertificateTable } from "../components/CertificateTable";
import { getCertificateStatus } from "../lib/certificateUtils";
import type { Certificate, CertificateStatus } from "../types/certificate";

type Filter = "all" | CertificateStatus;

export function RegistryPage({
  certificates,
  onView,
  onVerify,
}: {
  certificates: Certificate[];
  onView: (certificate: Certificate) => void;
  onVerify: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<"newest" | "oldest" | "recipient">("newest");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return certificates
      .filter((certificate) => {
        const matchesSearch = !term || [
          certificate.id,
          certificate.recipientName,
          certificate.recipientEmail ?? "",
          certificate.title,
          certificate.program,
          certificate.institution,
        ].some((value) => value.toLowerCase().includes(term));
        return matchesSearch && (filter === "all" || getCertificateStatus(certificate) === filter);
      })
      .sort((a, b) => {
        if (sort === "oldest") return a.issuedAt.localeCompare(b.issuedAt);
        if (sort === "recipient") return a.recipientName.localeCompare(b.recipientName);
        return b.issuedAt.localeCompare(a.issuedAt);
      });
  }, [certificates, filter, search, sort]);

  return (
    <div className="registry-page">
      <section className="page-intro">
        <div><span className="eyebrow">INSTITUTION RECORDS</span><h1>Certificate registry</h1><p>Search and manage credential records in your demo workspace.</p></div>
        <span className="record-count"><strong>{filtered.length}</strong> of {certificates.length} records</span>
      </section>
      <div className="panel registry-panel">
        <div className="registry-toolbar">
          <label className="registry-search">
            <Search size={17} />
            <span className="sr-only">Search the certificate registry</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search recipient, ID, certificate..." />
          </label>
          <label className="select-filter">
            <SlidersHorizontal size={16} /><span className="sr-only">Filter certificate status</span>
            <select value={filter} onChange={(event) => setFilter(event.target.value as Filter)}>
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="revoked">Revoked</option>
              <option value="expired">Expired</option>
            </select>
          </label>
          <label className="select-filter">
            <span className="sr-only">Sort certificate registry</span>
            <select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="recipient">Recipient A–Z</option>
            </select>
          </label>
        </div>
        {filtered.length ? (
          <CertificateTable certificates={filtered} onView={onView} onVerify={onVerify} />
        ) : (
          <div className="empty-state registry-empty">
            <div className="empty-icon"><FileSearch size={23} /></div>
            <h3>No certificates found</h3>
            <p>{certificates.length ? "Try changing the search or status filter." : "New demo-issued records will appear here."}</p>
            {(search || filter !== "all") && <button className="button button-secondary" type="button" onClick={() => { setSearch(""); setFilter("all"); }}>Clear filters</button>}
          </div>
        )}
      </div>
      <p className="registry-footnote"><span className="footnote-dot" /> All registry entries are temporary demo records stored in memory.</p>
    </div>
  );
}
