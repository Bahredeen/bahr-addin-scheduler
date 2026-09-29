import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarBlank, CheckCircle, Clock, Lightning, LockSimple, MapPin,
  Sparkle, UsersThree, Warning,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  actions, detectConflicts, findUser, fmt12, fromMin, isMine, itemAccess,
  nextOpenSlot, roomConflicts, toMin, todayStr, useApp,
} from "@/services/mockDataAndStore";
import {
  MEETING_ROOMS, VISIBILITY_META, WORK_END, WORK_START,
  type DraftScheduleItem, type ItemType, type VisibilityLevel,
} from "@/types/calendar";

const H_START = toMin(WORK_START);
const H_END = toMin(WORK_END);
const TOTAL = H_END - H_START;
const HOURS: string[] = [];
for (let m = H_START; m <= H_END; m += 60) HOURS.push(fromMin(m));

export default function DailyPlannerView() {
  const state = useApp();
  const me = findUser(state, state.currentUserId);
  const [type, setType] = useState<ItemType>("MEETING");
  const [title, setTitle] = useState("");
  const [agenda, setAgenda] = useState("");
  const [date, setDate] = useState(() => todayStr());
  const [start, setStart] = useState(() => {
    const m = H_START + 120;
    return fromMin(Math.min(m, H_END - 60));
  });
  const [end, setEnd] = useState(() => fromMin(Math.min(H_START + 180, H_END)));
  const [room, setRoom] = useState(MEETING_ROOMS[0]);
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [guests, setGuests] = useState("");
  const [visibility, setVisibility] = useState<VisibilityLevel>("PUBLIC");
  const [urgent, setUrgent] = useState(false);

  const draft: DraftScheduleItem = useMemo(
    () => ({
      type, title, agenda, date, start, end, room,
      ownerId: me?.id ?? "",
      participantIds,
      externalGuests: guests.split(",").map((g) => g.trim()).filter(Boolean),
      visibility,
      urgentOverride: type === "MEETING" && urgent,
    }),
    [type, title, agenda, date, start, end, room, me?.id, participantIds, guests, visibility, urgent],
  );

  if (!me) return null;

  const duration = toMin(end) - toMin(start);
  const conflicts = duration > 0 ? detectConflicts(state, draft) : [];
  const rooms = duration > 0 ? roomConflicts(state, draft) : [];

  const dayItems = state.scheduleItems.filter((i) => i.date === date);
  const mine = dayItems.filter((i) => isMine(state, i, me.id) && itemAccess(state, i, me.id) !== "none");
  const ghosts = dayItems.filter((i) => !isMine(state, i, me.id) && i.visibility === "PUBLIC");

  const nowMin = toMin(`${String(new Date().getHours()).padStart(2, "0")}:${String(new Date().getMinutes()).padStart(2, "0")}`);
  const showNowLine = date === todayStr();

  const pct = (m: number) => Math.min(100, Math.max(0, ((m - H_START) / TOTAL) * 100));

  const suggest = () => {
    const d = Math.max(30, duration > 0 ? duration : 60);
    const ids = participantIds.length ? participantIds : [me.id];
    const slot = nextOpenSlot(state, ids, date, d, room, H_START);
    if (!slot) {
      toast.error("No free slot fits in working hours today");
      return;
    }
    setStart(slot);
    setEnd(fromMin(toMin(slot) + d));
    toast.success(`Suggested ${fmt12(slot)} — first conflict-free window`);
  };

  const submit = () => {
    if (!title.trim()) {
      toast.error("Give the session a clear title");
      return;
    }
    if (duration <= 0) {
      toast.error("End time must be after the start time");
      return;
    }
    if (conflicts.length > 0 && !draft.urgentOverride) {
      toast.error(`${conflicts.length} scheduling conflict(s) detected — enable urgent override or pick another slot`);
      return;
    }
    actions.addScheduleItem(draft);
    if (draft.urgentOverride) toast.warning(`Urgent override used — ${title} locked immediately`);
    else if (type === "ACTIVITY" || me.isManager) toast.success(`${title} locked to the calendar automatically`);
    else toast.success(`${title} sent for attendee approval`);
    setTitle("");
    setAgenda("");
    setGuests("");
    setUrgent(false);
  };

  const toggleParticipant = (id: string) =>
    setParticipantIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));

  const groupUsers = state.users.filter((u) => u.groupIds.includes(state.currentGroupId));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-50">Daily Planner</h1>
          <p className="mt-1 text-sm text-slate-400">Build the day, run conflict detection before committing, and let the engine lock confirmed slots.</p>
        </div>
        <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-widest">
          {me.isManager ? "Manager · auto-lock enabled" : "Member · approval required"}
        </Badge>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="flex items-center gap-2">
            <CalendarBlank size={16} className="text-indigo-300" weight="duotone" />
            <h2 className="text-sm font-semibold text-slate-100">Compose a session</h2>
          </div>

          <div className="flex gap-1 rounded-lg border border-slate-800 bg-slate-950/50 p-1">
            {(["MEETING", "ACTIVITY"] as ItemType[]).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`flex-1 rounded-md px-3 py-2 text-xs font-medium transition ${type === t ? "bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-400/30" : "text-slate-400 hover:text-slate-200"}`}
              >
                {t === "MEETING" ? "Meeting (approval)" : "Activity (auto-lock)"}
              </button>
            ))}
          </div>

          <Field label="Title">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Line 3 capacity review"
              className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-indigo-500/50"
            />
          </Field>

          <Field label="Agenda">
            <textarea
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              rows={3}
              placeholder="What will be covered, and what decision is needed?"
              className="w-full resize-none rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-indigo-500/50"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Date">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500/50" />
            </Field>
            <Field label="Room">
              <select value={room} onChange={(e) => setRoom(e.target.value)} className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500/50">
                {MEETING_ROOMS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Start">
              <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 font-mono text-sm text-slate-100 outline-none focus:border-indigo-500/50" />
            </Field>
            <Field label="End">
              <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 font-mono text-sm text-slate-100 outline-none focus:border-indigo-500/50" />
            </Field>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
            <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Privacy visibility</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(Object.keys(VISIBILITY_META) as VisibilityLevel[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setVisibility(v)}
                  title={VISIBILITY_META[v].hint}
                  className={`rounded-md px-2.5 py-1.5 text-[11px] font-medium transition ${visibility === v ? "bg-slate-100 text-slate-900" : "border border-slate-800 text-slate-400 hover:text-slate-200"}`}
                >
                  {VISIBILITY_META[v].label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-slate-500">{VISIBILITY_META[visibility].hint}</p>
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Attendees · {groupUsers.length} in group</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {groupUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => toggleParticipant(u.id)}
                  className={`flex items-center gap-1.5 rounded-full border py-1 pl-1 pr-2.5 text-[11px] transition ${participantIds.includes(u.id) ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-200" : "border-slate-800 text-slate-400 hover:text-slate-200"}`}
                >
                  <span className="grid h-5 w-5 place-items-center rounded-full text-[9px] font-semibold text-white" style={{ backgroundColor: u.avatarColor }}>
                    {u.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                  </span>
                  {u.name.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          <Field label="External guests (comma separated)">
            <input value={guests} onChange={(e) => setGuests(e.target.value)} placeholder="Safety Board (Gov), TUV Auditor" className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-indigo-500/50" />
          </Field>

          {type === "MEETING" && (
            <button
              onClick={() => setUrgent((u) => !u)}
              className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition ${urgent ? "border-rose-500/50 bg-rose-500/10" : "border-slate-800 bg-slate-950/40 hover:border-slate-700"}`}
            >
              <Lightning size={16} className={urgent ? "text-rose-300" : "text-slate-500"} weight={urgent ? "fill" : "duotone"} />
              <span className="flex-1">
                <span className={`block text-xs font-medium ${urgent ? "text-rose-200" : "text-slate-200"}`}>Urgent override</span>
                <span className="block text-[11px] text-slate-500">Bypass conflicts, lock instantly and flag every attendee.</span>
              </span>
              <span className={`h-5 w-9 rounded-full p-0.5 transition ${urgent ? "bg-rose-500" : "bg-slate-700"}`}>
                <span className={`block h-4 w-4 rounded-full bg-white transition ${urgent ? "translate-x-4" : ""}`} />
              </span>
            </button>
          )}

          {duration > 0 && (conflicts.length > 0 || rooms.length > 0) && (
            <div className={`rounded-lg border p-3 text-xs ${draft.urgentOverride ? "border-amber-500/30 bg-amber-500/5" : "border-rose-500/35 bg-rose-500/5"}`}>
              <p className="flex items-center gap-2 font-medium text-rose-200">
                <Warning size={14} weight="duotone" /> {conflicts.length} attendee conflict(s) · {rooms.length} room clash(es)
              </p>
              <ul className="mt-2 space-y-1 text-slate-300">
                {conflicts.slice(0, 3).map((c, i) => (
                  <li key={i}>· {findUser(state, c.userId)?.name} is in “{c.item.title}” ({fmt12(c.item.start)}–{fmt12(c.item.end)})</li>
                ))}
                {rooms.slice(0, 2).map((r, i) => <li key={`r${i}`}>· {r.room} is booked by “{r.title}” ({fmt12(r.start)}–{fmt12(r.end)})</li>)}
              </ul>
              {!draft.urgentOverride && <p className="mt-2 text-[11px] text-slate-400">Enable urgent override for genuine emergencies, or use the auto-suggest button.</p>}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-1.5" onClick={suggest}>
              <Sparkle size={15} weight="duotone" /> Auto-suggest slot
            </Button>
            <Button className="flex-1 gap-1.5" onClick={submit}>
              <LockSimple size={15} weight="duotone" /> Commit to calendar
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/40">
          <header className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-indigo-300" weight="duotone" />
              <h2 className="text-sm font-semibold text-slate-100">Day rail · {new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</h2>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">08:00–18:00</span>
          </header>

          <div className="relative m-4 h-[560px] overflow-hidden rounded-xl border border-slate-800 bg-slate-950/40">
            {HOURS.map((h) => (
              <div key={h} className="absolute inset-x-0 border-t border-slate-800/60" style={{ top: `${pct(toMin(h))}%` }}>
                <span className="absolute left-2 -top-2.5 font-mono text-[10px] text-slate-600">{fmt12(h)}</span>
              </div>
            ))}

            {showNowLine && nowMin >= H_START && nowMin <= H_END && (
              <div className="absolute inset-x-0 z-20 border-t border-rose-500/70" style={{ top: `${pct(nowMin)}%` }}>
                <span className="absolute -left-0 -top-1 h-2 w-2 rounded-full bg-rose-500" />
              </div>
            )}

            {ghosts.map((g) => (
              <div
                key={g.id}
                className="absolute left-[4.6rem] right-3 z-10 rounded-md border border-dashed border-slate-700 bg-slate-800/20 p-1.5"
                style={{ top: `${pct(toMin(g.start))}%`, height: `${Math.max(5, ((toMin(g.end) - toMin(g.start)) / TOTAL) * 100)}%` }}
              >
                <p className="truncate font-mono text-[10px] uppercase tracking-widest text-slate-500">Busy · {g.room}</p>
              </div>
            ))}

            {mine.map((b) => {
              const masked = itemAccess(state, b, me.id) === "masked";
              const locked = b.status === "LOCKED";
              return (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`absolute left-[4.6rem] right-3 z-30 overflow-hidden rounded-md border p-2 ${masked ? "border-slate-700 bg-slate-800/50" : b.urgentOverride ? "border-rose-500/50 bg-rose-500/12" : locked ? "border-emerald-500/40 bg-emerald-500/10" : "border-amber-500/40 bg-amber-500/10"}`}
                  style={{ top: `${pct(toMin(b.start))}%`, height: `${Math.max(5, ((toMin(b.end) - toMin(b.start)) / TOTAL) * 100)}%` }}
                >
                  <div className="flex items-center gap-1.5">
                    {locked ? <LockSimple size={11} className="shrink-0 text-emerald-300" weight="fill" /> : <Clock size={11} className="shrink-0 text-amber-300" />}
                    <p className="truncate text-[11px] font-medium text-slate-100">{masked ? "Restricted block" : b.title}</p>
                  </div>
                  <p className="mt-0.5 truncate font-mono text-[10px] text-slate-400">{fmt12(b.start)}–{fmt12(b.end)} · {b.room}</p>
                </motion.div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3 px-5 pb-5 text-[10px] font-mono uppercase tracking-widest text-slate-500">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" /> locked</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" /> pending</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-400" /> urgent</span>
            <span className="flex items-center gap-1.5"><MapPin size={11} /> room clashes tracked</span>
            <span className="flex items-center gap-1.5"><UsersThree size={11} /> {groupUsers.length} in group</span>
          </div>
        </section>
      </div>

      <p className="flex items-center gap-2 text-[11px] text-slate-500">
        <CheckCircle size={13} className="text-emerald-400/70" weight="duotone" />
        Slots lock automatically for activities, managers and urgent overrides. Everything else waits for attendee approval.
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-slate-500">{label}</span>
      {children}
    </label>
  );
}