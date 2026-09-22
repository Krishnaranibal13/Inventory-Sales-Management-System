import { useState, type FormEvent, type ReactNode } from "react";
import { Eye, EyeOff, LockKeyhole, Mail, Package, ArrowRight, ShieldCheck } from "lucide-react";
import { API_BASE_URL, setToken } from "../auth";

type LoginProps = { onSuccess: () => void; onCreateAccount: () => void };

function Login({ onSuccess, onCreateAccount }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!email.trim() || !password) return setError("Enter your email and password.");
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, remember }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Unable to sign in.");
      setToken(data.access_token, remember);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally { setLoading(false); }
  };

  return <AuthShell>
    <div className="mb-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 shadow-xl shadow-violet-500/20"><Package size={27} /></div>
      <h1 className="mt-5 text-3xl font-bold">Welcome back</h1>
      <p className="mt-2 text-sm text-slate-400">Sign in to your Inventory Pro account</p>
    </div>
    <form onSubmit={submit} className="space-y-5">
      <Field icon={<Mail size={17} />} label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
      <div>
        <label className="mb-2 block text-sm text-slate-300">Password</label>
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 focus-within:border-violet-500/50">
          <LockKeyhole size={17} className="text-slate-500" /><input value={password} onChange={e => setPassword(e.target.value)} type={showPassword ? "text" : "password"} placeholder="Enter your password" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-600" />
          <button type="button" onClick={() => setShowPassword(v => !v)} className="text-slate-500 hover:text-white">{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button>
        </div>
      </div>
      {error && <div className="rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-300">{error}</div>}
      <label className="flex items-center gap-2 text-xs text-slate-400"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="accent-violet-500" /> Remember me</label>
      <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-3.5 text-sm font-semibold shadow-lg shadow-violet-600/20 transition hover:from-violet-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Signing in..." : <>Sign In <ArrowRight size={17}/></>}</button>
    </form>
    <p className="mt-7 text-center text-sm text-slate-500">Don't have an account? <button onClick={onCreateAccount} className="font-medium text-violet-400 hover:text-violet-300">Create one</button></p>
    <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-600"><ShieldCheck size={14}/> Passwords are securely hashed on the server</div>
  </AuthShell>;
}

function Field({ icon, label, type, value, onChange, placeholder }: { icon: ReactNode; label: string; type: string; value: string; onChange: (v:string)=>void; placeholder:string }) {
  return <div><label className="mb-2 block text-sm text-slate-300">{label}</label><div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 focus-within:border-violet-500/50"><span className="text-slate-500">{icon}</span><input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-600" /></div></div>;
}

export function AuthShell({ children }: { children: ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center bg-[#050914] px-5 py-10 text-white"><div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(124,58,237,.14),transparent_32%),radial-gradient(circle_at_80%_80%,rgba(37,99,235,.12),transparent_30%)]"/><div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0b1020]/90 p-7 shadow-2xl shadow-black/50 backdrop-blur-2xl sm:p-9">{children}</div></div>;
}
export default Login;
