import { useSyncExternalStore } from "react";
import type {
  AppState,
  ApprovalRequest,
  CompanyGroup,
  DraftScheduleItem,
  JoinRequest,
  NotebookEntry,
  ScheduleItem,
  User,
  VisibilityLevel,
} from "@/types/calendar";
import { WORK_END } from "@/types/calendar";

const pad = (n: number) => String(n).padStart(2, "0");
export const hhmm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
export const todayStr = (d: Date = new Date()) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const addMinutes = (base: Date, m: number) => new Date(base.getTime() + m * 60000);
export const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
export const fromMin = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
export const fmt12 = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? "PM" : "AM"}`;
};
export const uid = (p: string) =>
  `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const AVATAR_COLORS = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6", "#14b8a6", "#f97316"];
const randomColor = () => AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

const GROUPS: CompanyGroup[] = [
  { id: "g-acme", name: "Acme Industrial", industry: "Precision Manufacturing", joinCode: "ACME-201" },
  { id: "g-nexus", name: "Nexus Logistics", industry: "Freight & Distribution", joinCode: "NEX-445" },
  { id: "g-vertex", name: "Vertex Biotech", industry: "Pharma R&D", joinCode: "VTX-770" },
];

const USERS: User[] = [
  { id: "u-1", name: "Maya Chen", email: "maya.chen@acme.io", phone: "+1 415 220 1180", role: "Operations Lead", department: "Plant Operations", groupId: "g-acme", groupIds: ["g-acme"], avatarColor: "#6366f1", verified: true, isManager: true, visibility: "PUBLIC" },
  { id: "u-2", name: "Daniel Okafor", email: "daniel.okafor@acme.io", phone: "+1 415 220 1192", role: "Line Supervisor", department: "Plant Operations", groupId: "g-acme", groupIds: ["g-acme"], avatarColor: "#0ea5e9", verified: true, isManager: false, visibility: "PUBLIC" },
  { id: "u-3", name: "Sara Whitfield", email: "sara.whitfield@acme.io", phone: "+1 415 220 1144", role: "Quality Engineer", department: "Quality Assurance", groupId: "g-acme", groupIds: ["g-acme"], avatarColor: "#10b981", verified: false, isManager: false, visibility: "PARTIALLY_VISIBLE" },
  { id: "u-4", name: "Liam Ortega", email: "liam.ortega@nexus.co", phone: "+1 312 908 4410", role: "Dispatch Manager", department: "Logistics", groupId: "g-nexus", groupIds: ["g-nexus"], avatarColor: "#f59e0b", verified: true, isManager: true, visibility: "PUBLIC" },
  { id: "u-5", name: "Priya Nair", email: "priya.nair@nexus.co", phone: "+1 312 908 4426", role: "Route Planner", department: "Logistics", groupId: "g-nexus", groupIds: ["g-nexus"], avatarColor: "#f43f5e", verified: true, isManager: false, visibility: "PUBLIC" },
  { id: "u-6", name: "Tom Becker", email: "tom.becker@nexus.co", phone: "+1 312 908 4488", role: "Warehouse Technician", department: "Warehouse", groupId: "g-nexus", groupIds: ["g-nexus"], avatarColor: "#8b5cf6", verified: false, isManager: false, visibility: "PARTIALLY_VISIBLE" },
  { id: "u-7", name: "Aisha Rahman", email: "aisha.rahman@vertex.bio", phone: "+44 20 7946 0301", role: "R&D Director", department: "Research", groupId: "g-vertex", groupIds: ["g-vertex"], avatarColor: "#14b8a6", verified: true, isManager: true, visibility: "PUBLIC" },
  { id: "u-8", name: "Ken Tanaka", email: "ken.tanaka@vertex.bio", phone: "+44 20 7946 0315", role: "Lab Manager", department: "Research", groupId: "g-vertex", groupIds: ["g-vertex"], avatarColor: "#f97316", verified: true, isManager: false, visibility: "HIDDEN" },
  { id: "u-9", name: "Elena Rossi", email: "elena.rossi@vertex.bio", phone: "+44 20 7946 0399", role: "Compliance Officer", department: "Compliance", groupId: "g-vertex", groupIds: ["g-vertex"], avatarColor: "#64748b", verified: true, isManager: false, visibility: "PUBLIC" },
];

const NOTEBOOK: NotebookEntry[] = [
  { id: "n-1", category: "PLANT_FLOOR", title: "Line 3 bearing replaced", body: "Drive bearing replaced on Line 3. Vibration down from 4.2 to 0.8 mm/s. Monitor for 48h.", tags: ["maintenance", "line-3"], authorId: "u-2", createdAt: Date.now() - 5400000 },
  { id: "n-2", category: "SHIFT_HANDOVER", title: "Night shift handover", body: "Two pallets short on PO 8841, supplier notified. Forklift B on charge overnight.", tags: ["handover", "inventory"], authorId: "u-5", createdAt: Date.now() - 9000000 },
  { id: "n-3", category: "MEETING_MINUTES", title: "Capacity sync decisions", body: "Shift 12% of Q3 volume to Nexus line 2. Safety audit window confirmed for the 18th.", tags: ["capacity", "audit"], authorId: "u-1", createdAt: Date.now() - 14400000 },
];

const JOIN_REQUESTS: JoinRequest[] = [
  { id: "jr-1", groupId: "g-acme", userId: "u-6", state: "PENDING", createdAt: Date.now() - 3600000 },
  { id: "jr-2", groupId: "g-acme", userId: "u-8", state: "PENDING", createdAt: Date.now() - 7200000 },
];

function buildDemoSchedule(now: Date): ScheduleItem[] {
  const today = todayStr(now);
  const stamp = Date.now();
  const at = (off: number) => hhmm(addMinutes(now, off));
  return [
    { id: "demo-act-1", type: "ACTIVITY", title: "Line 3 Pre-Shift Inspection", agenda: "Torque check, lubrication sweep, safety guard verification.", date: today, start: at(-20), end: at(40), room: "Plant Floor A", ownerId: "u-1", participantIds: ["u-1", "u-2", "u-3"], externalGuests: [], visibility: "PUBLIC", status: "LOCKED", urgentOverride: false, demo: true, createdAt: stamp },
    { id: "demo-mtg-1", type: "MEETING", title: "Cross-Site Capacity Sync", agenda: "Align Q3 throughput allocation across Acme and Nexus lines.", date: today, start: at(50), end: at(80), room: "Boardroom 1", ownerId: "u-1", participantIds: ["u-1", "u-4", "u-7"], externalGuests: ["Safety Board (Gov)", "TUV Auditor"], visibility: "PUBLIC", status: "LOCKED", urgentOverride: false, demo: true, createdAt: stamp },
    { id: "demo-mtg-2", type: "MEETING", title: "Q3 Audit Prep", agenda: "Documentation walkthrough for the upcoming compliance review.", date: today, start: at(130), end: at(160), room: "Compliance Suite", ownerId: "u-7", participantIds: ["u-7", "u-1"], externalGuests: [], visibility: "PARTIALLY_VISIBLE", status: "PENDING", urgentOverride: false, demo: true, createdAt: stamp },
    { id: "demo-mtg-3", type: "MEETING", title: "Freight Reroute Planning", agenda: "Rework distribution routes around the dock maintenance closure.", date: today, start: at(185), end: at(215), room: "Dispatch Bay", ownerId: "u-4", participantIds: ["u-4", "u-1", "u-5"], externalGuests: ["Harbour Authority"], visibility: "PUBLIC", status: "PENDING", urgentOverride: false, demo: true, createdAt: stamp },
    { id: "demo-mtg-4", type: "MEETING", title: "Emergency Safety Briefing", agenda: "Walkthrough of the revised lockout procedure.", date: today, start: at(95), end: at(115), room: "Boardroom 2", ownerId: "u-7", participantIds: ["u-7", "u-1", "u-8"], externalGuests: [], visibility: "HIDDEN", status: "PENDING", urgentOverride: true, demo: true, createdAt: stamp },
    { id: "demo-act-2", type: "ACTIVITY", title: "Confidential Vendor Call", agenda: "Private supplier negotiation, details restricted.", date: today, start: at(-10), end: at(30), room: "Meeting Pod 4", ownerId: "u-3", participantIds: ["u-3", "u-2"], externalGuests: [], visibility: "HIDDEN", status: "LOCKED", urgentOverride: false, demo: true, createdAt: stamp },
  ];
}

function buildDemoApprovals(items: ScheduleItem[]): ApprovalRequest[] {
  const stamp = Date.now();
  const has = (id: string) => items.some((i) => i.id === id);
  const out: ApprovalRequest[] = [];
  if (has("demo-mtg-2")) out.push({ id: "demo-ap-1", scheduleItemId: "demo-mtg-2", inviteeId: "u-1", inviterId: "u-7", state: "PENDING", demo: true, createdAt: stamp });
  if (has("demo-mtg-3")) out.push({ id: "demo-ap-2", scheduleItemId: "demo-mtg-3", inviteeId: "u-1", inviterId: "u-4", state: "PENDING", demo: true, createdAt: stamp });
  if (has("demo-mtg-4")) out.push({ id: "demo-ap-3", scheduleItemId: "demo-mtg-4", inviteeId: "u-1", inviterId: "u-7", state: "PENDING", demo: true, createdAt: stamp });
  if (has("demo-mtg-1")) out.push({ id: "demo-ap-4", scheduleItemId: "demo-mtg-1", inviteeId: "u-4", inviterId: "u-1", state: "ACCEPTED", demo: true, createdAt: stamp });
  return out;
}

const STORAGE_KEY = "collab-schedule-state-v2";

function seed(): AppState {
  const now = new Date();
  const items = buildDemoSchedule(now);
  return {
    currentUserId: null,
    currentGroupId: "g-acme",
    users: USERS,
    groups: GROUPS,
    scheduleItems: items,
    approvals: buildDemoApprovals(items),
    notebook: NOTEBOOK,
    joinRequests: JOIN_REQUESTS,
    soundEnabled: true,
    seedDate: todayStr(now),
  };
}

function refreshDemo(p: AppState): AppState {
  const today = todayStr();
  if (p.seedDate === today) return p;
  const items = [...p.scheduleItems.filter((i) => !i.demo), ...buildDemoSchedule(new Date())];
  const approvals = [...p.approvals.filter((a) => !a.demo), ...buildDemoApprovals(items)];
  return { ...p, seedDate: today, scheduleItems: items, approvals };
}

function loadInitial(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return refreshDemo(JSON.parse(raw) as AppState);
  } catch {
    /* ignore */
  }
  return seed();
}

let state: AppState = loadInitial();
const listeners = new Set<() => void>();

function persist(s: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}
function commit(next: AppState) {
  state = next;
  persist(next);
  listeners.forEach((l) => l());
}
function mutate(producer: (s: AppState) => AppState) {
  commit(producer(state));
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useApp(): AppState {
  return useSyncExternalStore(subscribe, () => state, () => state);
}

export const findUser = (s: AppState, id: string | null | undefined) =>
  s.users.find((u) => u.id === id);
export const findGroup = (s: AppState, id: string) => s.groups.find((g) => g.id === id);

export function isMine(s: AppState, item: ScheduleItem, viewerId: string): boolean {
  return item.ownerId === viewerId || item.participantIds.includes(viewerId);
}

export type Access = "full" | "masked" | "none";

export function itemAccess(s: AppState, item: ScheduleItem, viewerId: string): Access {
  if (item.ownerId === viewerId) return "full";
  if (item.participantIds.includes(viewerId)) {
    if (item.type === "ACTIVITY") return "full";
    const ap = s.approvals.find((a) => a.scheduleItemId === item.id && a.inviteeId === viewerId);
    return ap && ap.state === "ACCEPTED" ? "full" : "none";
  }
  if (item.visibility === "PUBLIC") return "full";
  if (item.visibility === "PARTIALLY_VISIBLE") return "masked";
  return "none";
}

export function getTimeline(s: AppState, viewerId: string) {
  const today = todayStr();
  const nowMin = toMin(hhmm(new Date()));
  const mine = s.scheduleItems
    .filter((i) => i.date === today && isMine(s, i, viewerId) && itemAccess(s, i, viewerId) !== "none")
    .sort((a, b) => toMin(a.start) - toMin(b.start));
  const current = mine.find((i) => toMin(i.start) <= nowMin && nowMin < toMin(i.end));
  const next = mine.find((i) => toMin(i.start) > nowMin);
  return { current, next, nowMin, mine };
}

export interface Conflict {
  userId: string;
  item: ScheduleItem;
}

export function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return toMin(aStart) < toMin(bEnd) && toMin(bStart) < toMin(aEnd);
}

export function detectConflicts(s: AppState, draft: DraftScheduleItem, excludeId?: string): Conflict[] {
  const out: Conflict[] = [];
  const participants = new Set([draft.ownerId, ...draft.participantIds]);
  for (const item of s.scheduleItems) {
    if (item.id === excludeId || item.date !== draft.date || item.status === "DECLINED") continue;
    if (!overlaps(item.start, item.end, draft.start, draft.end)) continue;
    for (const p of participants) {
      if (item.ownerId === p || item.participantIds.includes(p)) {
        if (!out.some((c) => c.userId === p && c.item.id === item.id)) out.push({ userId: p, item });
      }
    }
  }
  return out;
}

export function roomConflicts(s: AppState, draft: DraftScheduleItem, excludeId?: string): ScheduleItem[] {
  return s.scheduleItems.filter(
    (i) => i.id !== excludeId && i.date === draft.date && i.room === draft.room && i.status !== "DECLINED" && overlaps(i.start, i.end, draft.start, draft.end),
  );
}

export function nextOpenSlot(s: AppState, participantIds: string[], date: string, duration: number, room: string, startAfter: number): string | null {
  for (let m = startAfter; m + duration <= toMin(WORK_END); m += 30) {
    const draft: DraftScheduleItem = { type: "MEETING", title: "", agenda: "", date, start: fromMin(m), end: fromMin(m + duration), room, ownerId: participantIds[0] ?? "", participantIds, externalGuests: [], visibility: "PUBLIC", urgentOverride: false };
    if (detectConflicts(s, draft).length === 0 && roomConflicts(s, draft).length === 0) return fromMin(m);
  }
  return null;
}

let audioCtx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  try {
    if (!audioCtx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new Ctor();
    }
    if (audioCtx.state === "suspended") void audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}
export function unlockAudio() {
  getCtx();
}
function tone(ctx: AudioContext, freq: number, start: number, dur: number, gain: number, type: OscillatorType) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(gain, start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0008, start + dur);
  o.connect(g);
  g.connect(ctx.destination);
  o.start(start);
  o.stop(start + dur + 0.05);
}
export function playChime() {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  tone(c, 880, t, 0.42, 0.16, "sine");
  tone(c, 1318.5, t + 0.18, 0.5, 0.14, "sine");
}
export function playAlarm() {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  for (let i = 0; i < 4; i++) tone(c, i % 2 === 0 ? 660 : 520, t + i * 0.22, 0.16, 0.13, "square");
}

export const actions = {
  login(userId: string) {
    mutate((s) => {
      const u = findUser(s, userId);
      return { ...s, currentUserId: userId, currentGroupId: u?.groupId ?? s.currentGroupId };
    });
  },
  logout() {
    mutate((s) => ({ ...s, currentUserId: null }));
  },
  switchGroup(groupId: string) {
    mutate((s) => ({ ...s, currentGroupId: groupId }));
  },
  setSound(enabled: boolean) {
    if (enabled) unlockAudio();
    mutate((s) => ({ ...s, soundEnabled: enabled }));
  },
  setVisibility(level: VisibilityLevel) {
    mutate((s) => (s.currentUserId ? { ...s, users: s.users.map((u) => (u.id === s.currentUserId ? { ...u, visibility: level } : u)) } : s));
  },
  addScheduleItem(draft: DraftScheduleItem): string {
    const id = uid("item");
    mutate((s) => {
      const owner = findUser(s, draft.ownerId);
      const autoLock = draft.type === "ACTIVITY" || draft.urgentOverride || !!owner?.isManager;
      const item: ScheduleItem = { ...draft, id, status: autoLock ? "LOCKED" : "PENDING", createdAt: Date.now() };
      const approvals: ApprovalRequest[] =
        draft.type === "MEETING"
          ? draft.participantIds.filter((p) => p !== draft.ownerId).map((p, i) => ({
              id: `${id}-ap-${i}`, scheduleItemId: id, inviteeId: p, inviterId: draft.ownerId,
              state: autoLock ? ("ACCEPTED" as const) : ("PENDING" as const), createdAt: Date.now(),
            }))
          : [];
      return { ...s, scheduleItems: [...s.scheduleItems, item], approvals: [...s.approvals, ...approvals] };
    });
    return id;
  },
  acceptApproval(id: string) {
    mutate((s) => {
      const ap = s.approvals.find((a) => a.id === id);
      if (!ap) return s;
      return {
        ...s,
        approvals: s.approvals.map((a) => (a.id === id ? { ...a, state: "ACCEPTED" as const } : a)),
        scheduleItems: s.scheduleItems.map((i) => (i.id === ap.scheduleItemId ? { ...i, status: "LOCKED" as const } : i)),
      };
    });
  },
  declineApproval(id: string) {
    mutate((s) => {
      const ap = s.approvals.find((a) => a.id === id);
      if (!ap) return s;
      const approvals = s.approvals.map((a) => (a.id === id ? { ...a, state: "DECLINED" as const } : a));
      const stillOk = approvals.some((a) => a.scheduleItemId === ap.scheduleItemId && a.state === "ACCEPTED");
      return {
        ...s, approvals,
        scheduleItems: s.scheduleItems.map((i) => (i.id === ap.scheduleItemId ? { ...i, status: stillOk ? ("LOCKED" as const) : ("PENDING" as const) } : i)),
      };
    });
  },
  addNotebookEntry(entry: Omit<NotebookEntry, "id" | "createdAt" | "authorId">): string {
    const id = uid("note");
    mutate((s) => ({ ...s, notebook: [{ ...entry, id, authorId: s.currentUserId ?? "u-1", createdAt: Date.now() }, ...s.notebook] }));
    return id;
  },
  deleteNotebookEntry(id: string) {
    mutate((s) => ({ ...s, notebook: s.notebook.filter((n) => n.id !== id) }));
  },
  requestJoin(groupId: string) {
    mutate((s) => {
      if (!s.currentUserId) return s;
      const u = findUser(s, s.currentUserId);
      if (u?.groupIds.includes(groupId)) return s;
      if (s.joinRequests.some((j) => j.groupId === groupId && j.userId === s.currentUserId && j.state === "PENDING")) return s;
      return { ...s, joinRequests: [{ id: uid("jr"), groupId, userId: s.currentUserId, state: "PENDING" as const, createdAt: Date.now() }, ...s.joinRequests] };
    });
  },
  approveJoin(id: string) {
    mutate((s) => {
      const jr = s.joinRequests.find((j) => j.id === id);
      if (!jr) return s;
      return {
        ...s,
        joinRequests: s.joinRequests.map((j) => (j.id === id ? { ...j, state: "APPROVED" as const } : j)),
        users: s.users.map((u) => (u.id === jr.userId && !u.groupIds.includes(jr.groupId) ? { ...u, groupIds: [...u.groupIds, jr.groupId] } : u)),
      };
    });
  },
  rejectJoin(id: string) {
    mutate((s) => ({ ...s, joinRequests: s.joinRequests.map((j) => (j.id === id ? { ...j, state: "REJECTED" as const } : j)) }));
  },
  registerUser(data: { name: string; email: string; phone: string; role: string; department: string; groupId: string }): string {
    const id = uid("user");
    const user: User = { id, ...data, groupIds: [data.groupId], avatarColor: randomColor(), verified: false, isManager: false, visibility: "PUBLIC" };
    mutate((s) => ({ ...s, users: [...s.users, user], currentUserId: id, currentGroupId: data.groupId }));
    return id;
  },
  verifyUser(id: string) {
    mutate((s) => ({ ...s, users: s.users.map((u) => (u.id === id ? { ...u, verified: true } : u)) }));
  },
  updateProfile(id: string, patch: Partial<User>) {
    mutate((s) => ({ ...s, users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) }));
  },
  resetDemo() {
    commit(seed());
  },
};