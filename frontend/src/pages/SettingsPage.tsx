import { useEffect, useState } from "react";
import { DEFAULT_APP_SETTINGS, loadSettings, saveSettings, type AppSettings } from "../settings";
import {
  Bell,
  Check,
  CircleHelp,
  Database,
  Globe2,
  Palette,
  RotateCcw,
  Save,
  Server,
  ShieldCheck,
  SlidersHorizontal,
  Store,
  Wifi,
} from "lucide-react";

type SettingsState = AppSettings;
const API_BASE_URL = "";

function Settings() {
  const [settings, setSettings] = useState<SettingsState>(loadSettings);
  const [savedSettings, setSavedSettings] = useState<SettingsState>(loadSettings);
  const [message, setMessage] = useState("");
  const [apiStatus, setApiStatus] = useState<"idle" | "checking" | "connected" | "offline">("idle");

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(savedSettings);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), 3000);
    return () => window.clearTimeout(timer);
  }, [message]);

  const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings((previous) => ({ ...previous, [key]: value }));
  };

  const saveChanges = () => {
    saveSettings(settings);
    setSavedSettings(settings);
    setMessage("Settings saved successfully.");
  };

  const resetSettings = () => {
    setSettings(DEFAULT_APP_SETTINGS);
    setSavedSettings(DEFAULT_APP_SETTINGS);
    saveSettings(DEFAULT_APP_SETTINGS);
    setMessage("Settings reset to default.");
  };

  const checkConnection = async () => {
    setApiStatus("checking");
    try {
      const response = await fetch(`${API_BASE_URL}/`);
      if (!response.ok) throw new Error("API unavailable");
      setApiStatus("connected");
    } catch {
      setApiStatus("offline");
    }
  };

  return (
    <section className="space-y-7">
      <div>
        <p className="text-sm text-slate-400">Application configuration</p>
        <h3 className="mt-1 text-3xl font-bold">Settings</h3>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Manage your inventory preferences, notifications, and system configuration.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-violet-500/20 bg-violet-500/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-violet-500/10 p-2.5 text-violet-400"><Save size={18} /></div>
          <div>
            <p className="text-sm font-medium text-slate-200">{hasChanges ? "Unsaved changes" : "All changes saved"}</p>
            <p className="text-xs text-slate-500">Settings are stored locally on this device.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {message && <span className="flex items-center gap-1.5 text-xs text-emerald-400"><Check size={14} />{message}</span>}
          <button type="button" onClick={resetSettings} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-slate-300 hover:bg-white/[0.08]"><RotateCcw size={15} />Reset</button>
          <button type="button" onClick={saveChanges} disabled={!hasChanges} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 disabled:cursor-not-allowed disabled:opacity-40"><Save size={15} />Save Changes</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <SettingsCard icon={<Store size={19} />} title="General" description="Basic business and display preferences.">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Business / Store Name"><input value={settings.businessName} onChange={(e) => updateSetting("businessName", e.target.value)} className={inputClass} /></Field>
            <Field label="Currency"><select value={settings.currency} onChange={(e) => updateSetting("currency", e.target.value)} className={inputClass}><option value="INR">INR — Indian Rupee (₹)</option><option value="USD">USD — US Dollar ($)</option><option value="EUR">EUR — Euro (€)</option><option value="GBP">GBP — Pound (£)</option></select></Field>
            <Field label="Date Format"><select value={settings.dateFormat} onChange={(e) => updateSetting("dateFormat", e.target.value)} className={inputClass}><option>DD/MM/YYYY</option><option>MM/DD/YYYY</option><option>YYYY-MM-DD</option></select></Field>
            <Field label="Low Stock Threshold"><input type="number" min="0" value={settings.lowStockThreshold} onChange={(e) => updateSetting("lowStockThreshold", Math.max(0, Number(e.target.value)))} className={inputClass} /></Field>
          </div>
        </SettingsCard>

        <SettingsCard icon={<Palette size={19} />} title="Appearance" description="Control the visual style of your workspace.">
          <Field label="Theme"><div className="grid grid-cols-2 gap-3"><ChoiceCard selected={settings.theme === "dark"} onClick={() => updateSetting("theme", "dark")} title="Dark" description="Current interface" /><ChoiceCard selected={settings.theme === "system"} onClick={() => updateSetting("theme", "system")} title="System" description="Use device preference" /></div></Field>
          <div className="mt-5"><Field label="Layout Density"><div className="grid grid-cols-2 gap-3"><ChoiceCard selected={settings.density === "comfortable"} onClick={() => updateSetting("density", "comfortable")} title="Comfortable" description="More breathing room" /><ChoiceCard selected={settings.density === "compact"} onClick={() => updateSetting("density", "compact")} title="Compact" description="More information" /></div></Field></div>
        </SettingsCard>

        <SettingsCard icon={<Bell size={19} />} title="Notifications" description="Choose which inventory events should appear as alerts.">
          <div className="space-y-3">
            <ToggleRow icon={<SlidersHorizontal size={17} />} title="Low Stock Alerts" description="Show alerts when products reach their reorder level." checked={settings.lowStockAlerts} onChange={(v) => updateSetting("lowStockAlerts", v)} />
            <ToggleRow icon={<Bell size={17} />} title="Sales Notifications" description="Show a notification after a sale is created." checked={settings.salesNotifications} onChange={(v) => updateSetting("salesNotifications", v)} />
            <ToggleRow icon={<Database size={17} />} title="Purchase Notifications" description="Show a notification after a purchase is created." checked={settings.purchaseNotifications} onChange={(v) => updateSetting("purchaseNotifications", v)} />
            <ToggleRow icon={<Server size={17} />} title="System Notifications" description="Show application and connection status alerts." checked={settings.systemNotifications} onChange={(v) => updateSetting("systemNotifications", v)} />
          </div>
        </SettingsCard>

        <SettingsCard icon={<ShieldCheck size={19} />} title="Security & Actions" description="Control confirmation behavior for destructive actions.">
          <ToggleRow icon={<ShieldCheck size={17} />} title="Confirm Before Delete" description="Ask for confirmation before deleting products or suppliers." checked={settings.confirmDelete} onChange={(v) => updateSetting("confirmDelete", v)} />
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-orange-400/10 bg-orange-400/[0.04] p-4"><CircleHelp size={18} className="mt-0.5 shrink-0 text-orange-300" /><p className="text-xs leading-5 text-slate-400">This controls the frontend confirmation experience. Database-level foreign-key protections remain unchanged.</p></div>
        </SettingsCard>

        <div className="xl:col-span-2">
          <SettingsCard icon={<Database size={19} />} title="System & Connection" description="View the current application connection details.">
            <div className="grid gap-4 md:grid-cols-3">
              <SystemInfo icon={<Globe2 size={18} />} label="Environment" value="Local Development" />
              <SystemInfo icon={<Server size={18} />} label="Backend API" value={API_BASE_URL} />
              <SystemInfo icon={<Database size={18} />} label="Database" value="MySQL" />
            </div>
            <div className="mt-5 flex flex-col gap-3 rounded-xl border border-white/5 bg-white/[0.025] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3"><div className={`rounded-lg p-2 ${apiStatus === "connected" ? "bg-emerald-500/10 text-emerald-400" : apiStatus === "offline" ? "bg-red-500/10 text-red-400" : "bg-blue-500/10 text-blue-400"}`}><Wifi size={17} /></div><div><p className="text-sm font-medium text-slate-200">API Connection</p><p className="text-xs text-slate-500">{apiStatus === "connected" ? "Backend is reachable." : apiStatus === "offline" ? "Backend is not reachable." : apiStatus === "checking" ? "Checking backend connection..." : "Connection has not been checked yet."}</p></div></div>
              <button type="button" onClick={checkConnection} disabled={apiStatus === "checking"} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-slate-300 hover:bg-white/[0.08] disabled:opacity-50">{apiStatus === "checking" ? "Checking..." : "Check Connection"}</button>
            </div>
          </SettingsCard>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-xs text-slate-500"><CircleHelp size={16} className="shrink-0 text-slate-400" /><p>General and appearance settings are applied across the app after saving. They are stored in this browser and do not modify your MySQL database.</p></div>
    </section>
  );
}

function SettingsCard({ icon, title, description, children }: { icon: React.ReactNode; title: string; description: string; children: React.ReactNode }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl"><div className="mb-6 flex items-start gap-3"><div className="rounded-xl bg-violet-500/10 p-2.5 text-violet-400">{icon}</div><div><h4 className="text-lg font-semibold text-white">{title}</h4><p className="mt-1 text-sm text-slate-500">{description}</p></div></div>{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-xs font-medium text-slate-400">{label}</span>{children}</label>;
}

function ChoiceCard({ selected, onClick, title, description }: { selected: boolean; onClick: () => void; title: string; description: string }) {
  return <button type="button" onClick={onClick} className={`rounded-xl border p-4 text-left transition ${selected ? "border-violet-500/50 bg-violet-500/[0.08]" : "border-white/10 bg-white/[0.025] hover:bg-white/[0.05]"}`}><div className="flex items-center justify-between"><p className="text-sm font-medium text-slate-200">{title}</p>{selected && <span className="rounded-full bg-violet-500/15 p-1 text-violet-400"><Check size={13} /></span>}</div><p className="mt-1 text-xs text-slate-500">{description}</p></button>;
}

function ToggleRow({ icon, title, description, checked, onChange }: { icon: React.ReactNode; title: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <div className="flex items-center justify-between gap-4 rounded-xl border border-white/5 bg-white/[0.025] p-4"><div className="flex min-w-0 items-center gap-3"><div className="rounded-lg bg-white/[0.04] p-2 text-slate-400">{icon}</div><div className="min-w-0"><p className="text-sm font-medium text-slate-200">{title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p></div></div><button type="button" aria-label={`${title}: ${checked ? "On" : "Off"}`} onClick={() => onChange(!checked)} className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-violet-600" : "bg-white/10"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${checked ? "left-6" : "left-1"}`} /></button></div>;
}

function SystemInfo({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-xl border border-white/5 bg-white/[0.025] p-4"><div className="flex items-center gap-2 text-xs text-slate-500">{icon}{label}</div><p className="mt-3 break-all text-sm font-medium text-slate-200">{value}</p></div>;
}

const inputClass = "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-200 outline-none transition focus:border-violet-500/50 focus:bg-white/[0.06]";

export default Settings;
