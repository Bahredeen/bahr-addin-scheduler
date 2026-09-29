import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowClockwise, Buildings, CaretDown, Check, CheckCircle, Clock, Eye, EyeSlash,
  LockSimple, SignOut, SpeakerHigh, SpeakerSlash, Timer,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  actions, findGroup, findUser, fmt12, getTimeline, playAlarm, playChime, toMin, useApp,
} from "@/services/mockDataAndStore";
import { VISIBILITY_META, type VisibilityLevel } from "@/types/calendar";

const pad = (n: number) => String(n).padStart(2, "0");
const initials = (n: string) => n.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
const fmtCountdown = (sec: number) => {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return h > 0 ? `${h}h ${pad(m)}m` : `${m}m ${pad(ss)}s`;
};

export default function HeaderBanner() {
  const state = useApp();
  const me = findUser(state, state.currentUserId);
  const group = findGroup(state, state.currentGroupId);
  const [tick, setTick] = useState(() => Date.now());

  useEffect(() => {
    const t = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const { current, next } = useMemo(() => getTimeline(state, state.currentUserId ?? ""), [state]);
  const target = current ?? next;

  const now = new Date(tick);
  const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const startSec = target ? toMin(target.start) * 60 : 0;
  const endSec = target ? toMin(target.end) * 60 : 0;
  const span = Math.max(1, endSec - startSec);
  const remaining = target ? (current ? endSec - nowSec : startSec - nowSec) : 0;
  const progress = !target
    ? 0
    : current
      ? Math.min(100, Math.max(0, ((nowSec - startSec) / span) * 100))
      : Math.min(100, Math.max(0, 100 - (remaining / span) * 100));

  const fired = useRef<Record<string, boolean>>({});
  useEffect(() => {
    if (!target || !state.soundEnabled || remaining <= 0) return;
    if (remaining <= 300 && !fired.current[`${target.id}-5`]) {
      fired.current[`${target.id}-5`] = true;
      playAlarm();
      toast.warning(`5-minute alert: ${target.title}`);
    } else if (remaining <= 600 && !fired.current[`${target.id}-10`]) {
      fired.current[`${target.id}-10`] = true;
      playChime();
      toast.info(`10-minute reminder: ${target.title}`);
    }
  }, [tick, target, remaining, state.soundEnabled]);

  if (!me) return null;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-4 py-3 lg:px-6">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-400/25">
            <LockSimple size={18} weight="duotone" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight text-slate-50">SlotLock</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Multi-tenant scheduler</p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-left transition hover:border-slate-700 hover:bg-slate-900">
              <Buildings size={15} className="text-slate-400" weight="duotone" />
              <span className="leading-tight">
                <span className="block text-xs font-medium text-slate-200">{group?.name ?? "Select company"}</span>
                <span className="block font-mono text-[10px] text-slate-500">{group?.industry}</span>
              </span>
              <CaretDown size={13} className="text-slate-500" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel>Company groups</DropdownMenuLabel>
            {state.groups.map((g) => (
              <DropdownMenuItem key={g.id} onClick={() => { actions.switchGroup(g.id); toast.success(`Switched to ${g.name}`); }}>
                <div className="flex w-full items-center justify-between gap-3">
                  <div>
                    <p className="text-sm">{g.name}</p>
                    <p className="text-[11px] text-muted-foreground">{g.industry}</p>
                  </div>
                  {g.id === state.currentGroupId && <Check size={14} className="text-indigo-400" />}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/60 p-1 sm:flex">
            {(Object.keys(VISIBILITY_META) as VisibilityLevel[]).map((k) => (
              <button
                key={k}
                onClick={() => { actions.setVisibility(k); toast.info(`Privacy set to ${VISIBILITY_META[k].label}`); }}
                title={VISIBILITY_META[k].hint}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition ${me.visibility === k ? "bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-400/30" : "text-slate-400 hover:text-slate-200"}`}
              >
                {k === "HIDDEN" ? <EyeSlash size={13} /> : <Eye size={13} />}
                {VISIBILITY_META[k].label}
              </button>
            ))}
          </div>

          <button
            onClick={() => { actions.setSound(!state.soundEnabled); toast(state.soundEnabled ? "Sound muted" : "Sound enabled"); }}
            aria-label="Toggle sound"
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-800 bg-slate-900/60 text-slate-300 transition hover:border-slate-700 hover:text-slate-100"
          >
            {state.soundEnabled ? <SpeakerHigh size={17} weight="duotone" /> : <SpeakerSlash size={17} />}
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-2 py-1.5 transition hover:border-slate-700">
                <span className="grid h-7 w-7 place-items-center rounded-full text-[11px] font-semibold text-white" style={{ backgroundColor: me.avatarColor }}>
                  {initials(me.name)}
                </span>
                <span className="hidden text-left leading-tight sm:block">
                  <span className="block text-xs font-medium text-slate-200">{me.name}</span>
                  <span className="block font-mono text-[10px] text-slate-500">{me.role}</span>
                </span>
                <CaretDown size={12} className="text-slate-500" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-full text-[11px] font-semibold text-white" style={{ backgroundColor: me.avatarColor }}>
                    {initials(me.name)}
                  </span>
                  <div className="leading-tight">
                    <p className="text-xs font-medium text-foreground">{me.name}</p>
                    <p className="text-[11px] text-muted-foreground">{me.email}</p>
                  </div>
                  {me.verified && <CheckCircle size={14} className="ml-auto text-emerald-400" weight="fill" />}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Switch account</DropdownMenuLabel>
              {state.users.filter((u) => u.groupIds.includes(state.currentGroupId)).slice(0, 6).map((u) => (
                <DropdownMenuItem key={u.id} onClick={() => { actions.login(u.id); toast.success(`Signed in as ${u.name}`); }}>
                  <span className="grid h-5 w-5 place-items-center rounded-full text-[9px] font-semibold text-white" style={{ backgroundColor: u.avatarColor }}>
                    {initials(u.name)}
                  </span>
                  <span className="text-sm">{u.name}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { actions.resetDemo(); toast.info("Demo data restored"); }}>
                <ArrowClockwise size={14} /> Reset demo data
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { actions.logout(); toast.info("Signed out"); }}>
                <SignOut size={14} /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="border-t border-slate-800/70 bg-slate-950/70">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-2.5 lg:px-6">
          {target ? (
            <AnimatePresence initial={false} mode="wait">
              <motion.div
                key={target.id}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
                className={`flex w-full flex-wrap items-center gap-3 rounded-xl border px-3 py-2 ${current ? "border-emerald-500/30 bg-emerald-500/5" : "border-indigo-500/30 bg-indigo-500/5"}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`grid h-8 w-8 place-items-center rounded-lg ${current ? "bg-emerald-500/15 text-emerald-300" : "bg-indigo-500/15 text-indigo-300"}`}>
                    {current ? <Timer size={16} weight="duotone" /> : <Clock size={16} weight="duotone" />}
                  </span>
                  <div className="leading-tight">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">{current ? "In progress" : "Up next"}</p>
                    <p className="text-sm font-medium text-slate-100">{target.title}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                  <span className="font-mono">{fmt12(target.start)}–{fmt12(target.end)}</span>
                  <span className="hidden sm:inline">· {target.room}</span>
                  <span className="hidden md:inline">· {target.participantIds.length} attendees</span>
                  {target.externalGuests.length > 0 && <span className="hidden lg:inline">· {target.externalGuests.length} guest(s)</span>}
                </div>
                <div className="ml-auto flex items-center gap-3">
                  <div className="hidden w-40 sm:block">
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                      <motion.div
                        className={current ? "h-full bg-emerald-400" : "h-full bg-indigo-400"}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">{current ? "Ends in" : "Starts in"}</p>
                    <p className={`font-mono text-lg font-semibold tabular-nums ${current ? "text-emerald-300" : "text-indigo-300"}`}>{fmtCountdown(remaining)}</p>
                  </div>
                  {state.soundEnabled && (
                    <div className="hidden items-center gap-1.5 lg:flex">
                      <button onClick={playChime} className="rounded-md border border-slate-800 px-2 py-1 font-mono text-[10px] text-slate-400 hover:text-slate-200">10m</button>
                      <button onClick={playAlarm} className="rounded-md border border-slate-800 px-2 py-1 font-mono text-[10px] text-slate-400 hover:text-slate-200">5m</button>
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="flex items-center gap-2 text-[12px] text-slate-500">
              <Clock size={15} /> No active or upcoming sessions today — your calendar is clear.
            </div>
          )}
        </div>
      </div>
    </header>
  );
}