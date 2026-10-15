import { Bell, Building2, CircleHelp, ExternalLink, ShieldAlert, SlidersHorizontal } from "lucide-react";

export function SettingsPage({
  institutionName,
  onInstitutionNameChange,
  notificationsEnabled,
  onNotificationsChange,
}: {
  institutionName: string;
  onInstitutionNameChange: (name: string) => void;
  notificationsEnabled: boolean;
  onNotificationsChange: (enabled: boolean) => void;
}) {
  return (
    <div className="settings-page">
      <section className="page-intro">
        <div><span className="eyebrow">WORKSPACE PREFERENCES</span><h1>Institution settings</h1><p>Demo profile details and local application preferences.</p></div>
      </section>
      <div className="settings-notice"><ShieldAlert size={17} /><span>Demo administrator controls are for preview only. This interface does not provide authentication or secure role-based permissions.</span></div>

      <section className="panel settings-card">
        <div className="settings-section-heading"><span className="settings-icon"><Building2 size={18} /></span><div><h2>Institution profile</h2><p>Details shown on new demo certificate records.</p></div><span className="demo-tag">DEMO PROFILE</span></div>
        <div className="field-grid settings-fields">
          <div className="field-group"><label className="field-label" htmlFor="settings-institution">Institution name</label><input id="settings-institution" value={institutionName} onChange={(event) => onInstitutionNameChange(event.target.value)} maxLength={120} /></div>
          <div className="field-group"><span className="field-label">Workspace type</span><div className="static-field">Higher education institution</div></div>
          <div className="field-group"><span className="field-label">Workspace ID</span><div className="static-field"><code>DEMO-NBU-2026</code></div></div>
          <div className="field-group"><span className="field-label">Connected network</span><div className="static-field network-offline"><i /> Not connected</div></div>
        </div>
        <p className="settings-footnote">Profile edits become the default for new demo records. Changes are held in memory and reset after refresh.</p>
      </section>

      <section className="panel settings-card">
        <div className="settings-section-heading"><span className="settings-icon settings-icon-green"><SlidersHorizontal size={18} /></span><div><h2>Preferences</h2><p>Adjust this demo workspace experience.</p></div></div>
        <div className="preference-row">
          <span className="preference-icon"><Bell size={17} /></span>
          <span className="preference-copy"><strong>Activity notifications</strong><small>Show notification indicators for demo workspace updates</small></span>
          <button className={`toggle ${notificationsEnabled ? "toggle-on" : ""}`} type="button" role="switch" aria-checked={notificationsEnabled} aria-label="Activity notifications" onClick={() => onNotificationsChange(!notificationsEnabled)}><span /></button>
        </div>
      </section>

      <section className="panel settings-card integration-card">
        <div className="settings-section-heading"><span className="settings-icon settings-icon-gold"><CircleHelp size={18} /></span><div><h2>Future integrations</h2><p>These connections are not implemented or configured.</p></div></div>
        <div className="integration-row"><div><strong>Google Apps Script / Sheets</strong><p>Future off-chain metadata adapter; no URL, credentials, or live connection is configured.</p></div><span className="coming-soon">NOT CONNECTED</span></div>
        <div className="integration-row"><div><strong>Local Hardhat contract</strong><p>Future contract adapter for issuance, reads, hash checks, revocation, and transaction results.</p></div><span className="coming-soon">NOT CONNECTED</span></div>
        <p className="integration-doc-link">Integration contract notes: <code>frontend/README.md</code> <ExternalLink size={14} /></p>
      </section>
    </div>
  );
}
