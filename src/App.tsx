import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Buildings, CalendarBlank, CheckCircle, ClipboardText, Envelope, LockSimple,
  NotePencil, Phone, SignIn, SquaresFour, UserPlus,
} from "@phosphor-icons/react";
import { Toaster, toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import HeaderBanner from "@/components/HeaderBanner";
import DashboardView from "@/components/DashboardView";
import ApprovalsView from "@/components/ApprovalsView";
import DailyPlannerView from "@/components/DailyPlannerView";
import NotebookAndDirectoryView from "@/components/NotebookAndDirectoryView";
import { actions, findUser, useApp } from "@/services/mockDataAndStore";
import type { TabKey } from "@/types/calendar";

const NAV: { key: TabKey; label: string; icon: typeof SquaresFour; hint: string }[] = [
  { key: "dashboard", label: "Dashboard", icon: SquaresFour, hint: "Today at a glance" },
  { key: "planner", label: "Daily Planner", icon: CalendarBlank, hint: "Compose & lock sessions" },
  { key: "approvals", label: "Group Approvals", icon: ClipboardText, hint: "Review invitations" },
  { key: "notebook", label: "Notebook", icon: NotePencil, hint: "Logs & directory" },
];

export default function App() {
  const state = useApp();
  const me = findUser(state, state.currentUserId);
  const [tab, setTab] = useState<TabKey>("dashboard");
  const pending = me ? state.approvals.filter((a) => a.inviteeId === me.id && a.state === "PENDING").length : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 antialiased">
      <Toaster theme="dark" position="top-right" richColors />
      <AnimatePresence mode="wait">
        {!me ? (
          <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AuthScreen />
          </motion.div>
        ) : (
          <motion.div key="app" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <HeaderBanner />

            <nav className="border-b border-slate-800/70 bg-slate-950/60">
              <div className="mx-auto flex max-w-[1400px] items-center gap-1 overflow-x-auto px-4 py-2 lg:px-6">
                {NAV.map((n) => {
                  const active = tab === n.key;
                  return (
                    <button
                      key={n.key}
                      onClick={() => setTab(n.key)}
                      title={n.hint}
                      className={`relative flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition ${active ? "text-slate-50" : "text-slate-400 hover:text-slate-200"}`}
                    >
                      {active && (
                        <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-lg bg-slate-800 ring-1 ring-slate-700" transition={{ type: "spring", stiffness: 420, damping: 34 }} />
                      )}
                      <n.icon size={15} weight="duotone" className={`relative ${active ? "text-indigo-300" : ""}`} />
                      <span className="relative">{n.label}</span>
                      {n.key === "approvals" && pending > 0 && (
                        <span className="relative rounded-full bg-amber-500/20 px-1.5 py-0.5 font-mono text-[10px] text-amber-200">{pending}</span>
                      )}
                    </button>
                  );
                })}
                <span className="ml-auto hidden shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-600 lg:block">
                  {state.scheduleItems.length} slots · {state.users.length} people · {state.groups.length} companies
                </span>
              </div>
            </nav>

            <main className="mx-auto max-w-[1400px] px-4 py-6 lg:px-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  {tab === "dashboard" && <DashboardView onNavigate={setTab} />}
                  {tab === "planner" && <DailyPlannerView />}
                  {tab === "approvals" && <ApprovalsView />}
                  {tab === "notebook" && <NotebookAndDirectoryView />}
                </motion.div>
              </AnimatePresence>
            </main>

            <footer className="border-t border-slate-800/70 py-6">
              <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-2 px-4 text-[11px] text-slate-500 lg:px-6">
                <span>SlotLock — multi-tenant scheduling, approvals and group coordination.</span>
                <span className="font-mono uppercase tracking-widest">Demo workspace · data stays in your browser</span>
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AuthScreen() {
  const state = useApp();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loginGroup, setLoginGroup] = useState(() => state.groups[0]?.id ?? "");
  const [loginUser, setLoginUser] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", role: "", department: "", groupId: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const groupId = form.groupId || state.groups[0]?.id || "";
  const groupUsers = state.users.filter((u) => u.groupIds.includes(loginGroup));

  const doLogin = () => {
    if (!loginUser) {
      toast.error("Pick a company account to continue");
      return;
    }
    actions.login(loginUser);
    toast.success("Welcome back to SlotLock");
  };

  const doSignup = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Legal name is required";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid work email";
    if (form.phone.replace(/\D/g, "").length < 8) e.phone = "Enter a reachable phone number";
    if (!form.role.trim()) e.role = "Role is required";
    if (!form.department.trim()) e.department = "Department is required";
    setErrors(e);
    if (Object.keys(e).length > 0) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    actions.registerUser({ ...form, groupId });
    toast.success("Account created — verification pending with your company manager");
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between overflow-hidden border-r border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 p-10 lg:flex">
        <div className="pointer-events-none absolute -left-20 top-1/3 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-400/25">
              <LockSimple size={22} weight="duotone" />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight text-slate-50">SlotLock</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Multi-tenant scheduler</p>
            </div>
          </div>
          <h1 className="mt-10 max-w-md text-3xl font-semibold leading-tight tracking-tight text-slate-50">
            One calendar for every company, plant and shift you run.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
            Join a company group, set how much of your day peers can see, detect conflicts before they happen, and let urgent briefings override the lock.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-slate-300">
            {[
              "Conflict detection with urgent override",
              "Automatic slot locking once approved",
              "Live countdown banner with audio reminders",
              "Per-user privacy: public, partial or hidden",
            ].map((f) => (
              <li key={f} className="flex items-center gap-2.5">
                <CheckCircle size={16} className="text-emerald-400" weight="duotone" /> {f}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Tenants on this workspace</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {state.groups.map((g) => (
              <span key={g.id} className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-1.5 text-[11px] text-slate-300">
                <Buildings size={13} className="text-indigo-300" weight="duotone" /> {g.name}
                <span className="font-mono text-[10px] text-slate-500">{g.joinCode}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-400/25">
              <LockSimple size={20} weight="duotone" />
            </div>
            <div>
              <p className="font-semibold tracking-tight text-slate-50">SlotLock</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Multi-tenant scheduler</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <div className="flex gap-1 rounded-lg border border-slate-800 bg-slate-950/60 p-1">
              {(["login", "signup"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setErrors({}); }}
                  className={`flex-1 rounded-md px-3 py-2 text-xs font-medium transition ${mode === m ? "bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-400/30" : "text-slate-400 hover:text-slate-200"}`}
                >
                  {m === "login" ? "Sign in" : "Create account"}
                </button>
              ))}
            </div>

            {mode === "login" ? (
              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-slate-500">Company group</span>
                  <select
                    value={loginGroup}
                    onChange={(e) => { setLoginGroup(e.target.value); setLoginUser(""); }}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500/50"
                  >
                    {state.groups.map((g) => <option key={g.id} value={g.id}>{g.name} — {g.industry}</option>)}
                  </select>
                </label>

                <div>
                  <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-slate-500">Choose your account</span>
                  <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
                    {groupUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => setLoginUser(u.id)}
                        className={`flex w-full items-center gap-2.5 rounded-lg border p-2.5 text-left transition ${loginUser === u.id ? "border-indigo-500/50 bg-indigo-500/10" : "border-slate-800 bg-slate-950/40 hover:border-slate-700"}`}
                      >
                        <span className="grid h-8 w-8 place-items-center rounded-full text-[11px] font-semibold text-white" style={{ backgroundColor: u.avatarColor }}>
                          {u.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                        </span>
                        <span className="min-w-0 flex-1 leading-tight">
                          <span className="block truncate text-xs font-medium text-slate-100">{u.name}</span>
                          <span className="block truncate text-[11px] text-slate-500">{u.role} · {u.department}</span>
                        </span>
                        {u.isManager && <Badge variant="outline" className="text-[10px]">Manager</Badge>}
                      </button>
                    ))}
                  </div>
                </div>

                <Button className="w-full gap-2" onClick={doLogin}>
                  <SignIn size={16} weight="duotone" /> Sign in to SlotLock
                </Button>
                <p className="text-center text-[11px] text-slate-500">Demo workspace — pick any account instantly, no password needed.</p>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <Input label="Full name" value={form.name} error={errors.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Amara Nwosu" icon={<UserPlus size={14} />} />
                <Input label="Work email" value={form.email} error={errors.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="amara@company.com" icon={<Envelope size={14} />} />
                <Input label="Phone" value={form.phone} error={errors.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="+1 415 555 0132" icon={<Phone size={14} />} />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Role" value={form.role} error={errors.role} onChange={(v) => setForm({ ...form, role: v })} placeholder="Line Supervisor" />
                  <Input label="Department" value={form.department} error={errors.department} onChange={(v) => setForm({ ...form, department: v })} placeholder="Operations" />
                </div>
                <label className="block">
                  <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-slate-500">Join company group</span>
                  <select
                    value={groupId}
                    onChange={(e) => setForm({ ...form, groupId: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500/50"
                  >
                    {state.groups.map((g) => <option key={g.id} value={g.id}>{g.name} — code {g.joinCode}</option>)}
                  </select>
                </label>
                <Button className="w-full gap-2" onClick={doSignup}>
                  <CheckCircle size={16} weight="duotone" /> Create account
                </Button>
                <p className="text-center text-[11px] text-slate-500">New accounts stay unverified until your company manager approves them.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function Input({
  label, value, onChange, placeholder, error, icon,
}: { label: string; value: string; onChange: (v: string) => void; placeholder: string; error?: string; icon?: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-slate-500">{label}</span>
      <span className="relative block">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{icon}</span>}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-lg border bg-slate-950/60 py-2 pr-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-indigo-500/50 ${icon ? "pl-9" : "pl-3"} ${error ? "border-rose-500/60" : "border-slate-800"}`}
        />
      </span>
      {error && <span className="mt-1 block text-[11px] text-rose-300">{error}</span>}
    </label>
  );
}