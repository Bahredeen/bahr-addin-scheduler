import { motion } from "framer-motion";
import {
  ArrowRight, CalendarBlank, ChartBar, CheckCircle, ClipboardText, Clock,
  Lightning, LockSimple, NotePencil, UsersThree, Warning,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  findGroup, findUser, fmt12, isMine, itemAccess, overlaps, toMin, todayStr, useApp,
} from "@/services/mockDataAndStore";
import { VISIBILITY_META, type ScheduleItem, type TabKey } from "@/types/calendar";

export default function DashboardView({ onNavigate }: { onNavigate: (t: TabKey) => void }) {
  const state = useApp();
  const me = findUser(state, state.currentUserId);
  if (!me) return null;

  const today = todayStr();
  const mine = state.scheduleItems
    .filter((i) => i.date === today && isMine(state, i, me.id) && itemAccess(state, i, me.id) !== "none")
    .sort((a, b) => toMin(a.start) - toMin(b.start));
  const pending = state.approvals.filter((a) => a.inviteeId === me.id && a.state === "PENDING");
  const locked = mine.filter((i) => i.status === "LOCKED");
  const urgent = mine.filter((i) => i.urgentOverride);

  const conflicts: { a: ScheduleItem; b: ScheduleItem }[] = [];
  for (let i = 0; i < mine.length; i++) {
    for (let j = i + 1; j < mine.length; j++) {
      if (overlaps(mine[i].start, mine[i].end, mine[j].start, mine[j].end)) conflicts.push({ a: mine[i], b: mine[j] });
    }
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const group = findGroup(state, me.groupId);

  const metrics = [
    { label: "Sessions today", value: mine.length, icon: CalendarBlank, tone: "text-indigo-300" },
    { label: "Locked slots", value: locked.length, icon: LockSimple, tone: "text-emerald-300" },
    { label: "Awaiting you", value: pending.length, icon: ClipboardText, tone: "text-amber-300" },
    { label: "Urgent briefings", value: urgent.length, icon: Lightning, tone: "text-rose-300" },
  ];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/80 to-slate-950 p-6">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-indigo-300">
              {group?.name} · {group?.industry}
            </p>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
              {greeting}, {me.name.split(" ")[0]}
            </h1>
            <p className="mt-1.5 max-w-xl text-sm text-slate-400">
              Operations cockpit for {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}.
              Your privacy is set to <span className="text-slate-200">{VISIBILITY_META[me.visibility].label}</span>.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => onNavigate("planner")} className="gap-1.5">
              <CalendarBlank size={15} weight="duotone" /> New schedule
            </Button>
            <Button variant="outline" onClick={() => onNavigate("approvals")} className="gap-1.5">
              <ClipboardText size={15} /> Approvals
              {pending.length > 0 && <Badge className="ml-0.5 bg-amber-500/20 text-amber-200">{pending.length}</Badge>}
            </Button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metrics.map((m, idx) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.35 }}
            className="rounded-xl border border-slate-800 bg-slate-900/50 p-4"
          >
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">{m.label}</p>
              <m.icon size={16} className={m.tone} weight="duotone" />
            </div>
            <p className="mt-2 font-mono text-3xl font-semibold tabular-nums text-slate-50">{String(m.value).padStart(2, "0")}</p>
          </motion.div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40">
          <header className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-indigo-300" weight="duotone" />
              <h2 className="text-sm font-semibold text-slate-100">Today's timeline</h2>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">{mine.length} blocks</span>
          </header>
          <div className="divide-y divide-slate-800/70">
            {mine.length === 0 && (
              <p className="px-5 py-10 text-center text-sm text-slate-500">Nothing scheduled for you today. Build a plan in the Daily Planner.</p>
            )}
            {mine.map((item) => {
              const masked = itemAccess(state, item, me.id) === "masked";
              return (
                <div key={item.id} className="flex gap-4 px-5 py-3.5">
                  <div className="w-20 shrink-0 pt-0.5">
                    <p className="font-mono text-xs font-medium text-slate-200">{fmt12(item.start)}</p>
                    <p className="font-mono text-[10px] text-slate-500">{fmt12(item.end)}</p>
                  </div>
                  <div className={`min-w-0 flex-1 ${masked ? "opacity-70" : ""}`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium text-slate-100">{masked ? "Busy — restricted" : item.title}</p>
                      <Badge variant="outline" className="text-[10px]">{item.type === "MEETING" ? "Meeting" : "Activity"}</Badge>
                      {item.urgentOverride && <Badge className="bg-rose-500/15 text-[10px] text-rose-300">Urgent</Badge>}
                      {item.status === "LOCKED" && <Badge className="bg-emerald-500/15 text-[10px] text-emerald-300">Locked</Badge>}
                      {item.status === "PENDING" && <Badge className="bg-amber-500/15 text-[10px] text-amber-300">Pending</Badge>}
                      {masked && <Badge variant="outline" className="text-[10px]">{VISIBILITY_META[item.visibility].label}</Badge>}
                    </div>
                    <p className="mt-1 line-clamp-1 text-xs text-slate-400">
                      {masked ? "Details hidden by the owner's privacy setting." : item.agenda}
                    </p>
                    <div className="mt-1.5 flex items-center gap-3 text-[11px] text-slate-500">
                      <span>{item.room}</span>
                      {!masked && <span>{item.participantIds.length} attendees</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="space-y-4">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
            <div className="flex items-center gap-2">
              <Warning size={16} className={conflicts.length ? "text-amber-300" : "text-slate-500"} weight="duotone" />
              <h2 className="text-sm font-semibold text-slate-100">Conflict engine</h2>
            </div>
            {conflicts.length === 0 ? (
              <p className="mt-3 flex items-center gap-2 text-xs text-emerald-300/80">
                <CheckCircle size={14} weight="duotone" /> No overlapping slots detected across your groups.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {conflicts.map((c, i) => (
                  <li key={i} className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-2.5 text-xs">
                    <p className="font-medium text-amber-200">{c.a.title} ↔ {c.b.title}</p>
                    <p className="mt-0.5 text-slate-400">
                      {fmt12(c.a.start)}–{fmt12(c.a.end)} overlaps {fmt12(c.b.start)}–{fmt12(c.b.end)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardText size={16} className="text-amber-300" weight="duotone" />
                <h2 className="text-sm font-semibold text-slate-100">Awaiting your approval</h2>
              </div>
              <button onClick={() => onNavigate("approvals")} className="flex items-center gap-1 text-[11px] text-indigo-300 hover:text-indigo-200">
                Open <ArrowRight size={12} />
              </button>
            </div>
            {pending.length === 0 ? (
              <p className="mt-3 text-xs text-slate-500">No invitations waiting. You are all caught up.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {pending.slice(0, 3).map((a) => {
                  const item = state.scheduleItems.find((i) => i.id === a.scheduleItemId);
                  const inviter = findUser(state, a.inviterId);
                  if (!item) return null;
                  return (
                    <li key={a.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/40 p-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-slate-200">{item.title}</p>
                        <p className="mt-0.5 font-mono text-[10px] text-slate-500">{fmt12(item.start)} · from {inviter?.name}</p>
                      </div>
                      {item.urgentOverride && <Lightning size={14} className="shrink-0 text-rose-300" weight="fill" />}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
            <div className="flex items-center gap-2">
              <ChartBar size={16} className="text-indigo-300" weight="duotone" />
              <h2 className="text-sm font-semibold text-slate-100">Quick launch</h2>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {([
                { label: "Daily Planner", icon: CalendarBlank, tab: "planner" as TabKey },
                { label: "Group Approvals", icon: ClipboardText, tab: "approvals" as TabKey },
                { label: "Ops Notebook", icon: NotePencil, tab: "notebook" as TabKey },
                { label: "Directory", icon: UsersThree, tab: "notebook" as TabKey },
              ]).map((q) => (
                <button
                  key={q.label}
                  onClick={() => onNavigate(q.tab)}
                  className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2.5 text-left text-xs font-medium text-slate-300 transition hover:border-indigo-500/40 hover:text-slate-100"
                >
                  <q.icon size={15} weight="duotone" className="text-indigo-300" /> {q.label}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}