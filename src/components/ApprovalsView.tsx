import { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle, ClipboardText, Lightning, MapPin, PaperPlaneTilt,
  UsersThree, XCircle, Warning,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { actions, findUser, fmt12, useApp } from "@/services/mockDataAndStore";
import { VISIBILITY_META } from "@/types/calendar";

const initials = (n: string) => n.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

export default function ApprovalsView() {
  const state = useApp();
  const me = findUser(state, state.currentUserId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  if (!me) return null;

  const incoming = state.approvals.filter((a) => a.inviteeId === me.id && a.state === "PENDING");
  const resolved = state.approvals.filter((a) => a.inviteeId === me.id && a.state !== "PENDING");
  const sent = state.approvals.filter((a) => a.inviterId === me.id);
  const selected = input(state, selectedId, incoming);

  const accept = (id: string, title: string) => {
    actions.acceptApproval(id);
    toast.success(`${title} locked to your calendar`);
    setSelectedId(null);
  };
  const decline = (id: string, title: string) => {
    actions.declineApproval(id);
    toast.info(`${title} declined`);
    setSelectedId(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-50">Group Approvals</h1>
          <p className="mt-1 text-sm text-slate-400">Review invitations, lock accepted slots and keep the multi-tenant calendar conflict-free.</p>
        </div>
        <Badge className="bg-amber-500/15 text-amber-200">{incoming.length} awaiting decision</Badge>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <section className="space-y-3">
          <h2 className="font-mono text-[11px] uppercase tracking-widest text-slate-500">Incoming queue</h2>
          {incoming.length === 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-center text-sm text-slate-500">
              <CheckCircle size={22} className="mx-auto mb-2 text-emerald-400/70" weight="duotone" />
              No invitations awaiting your decision.
            </div>
          )}
          {incoming.map((a) => {
            const item = state.scheduleItems.find((i) => i.id === a.scheduleItemId);
            const inviter = findUser(state, a.inviterId);
            if (!item) return null;
            const isSelected = selected?.id === a.id;
            return (
              <button
                key={a.id}
                onClick={() => setSelectedId(a.id)}
                className={`w-full rounded-xl border p-4 text-left transition ${isSelected ? "border-indigo-500/50 bg-indigo-500/5" : "border-slate-800 bg-slate-900/40 hover:border-slate-700"}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {item.urgentOverride ? <Lightning size={15} className="text-rose-300" weight="fill" /> : <ClipboardText size={15} className="text-amber-300" weight="duotone" />}
                    <p className="text-sm font-medium text-slate-100">{item.title}</p>
                  </div>
                  {item.urgentOverride && <Badge className="bg-rose-500/15 text-[10px] text-rose-300">Urgent override</Badge>}
                </div>
                <p className="mt-1.5 line-clamp-2 text-xs text-slate-400">{item.agenda}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                  <span className="font-mono">{fmt12(item.start)}–{fmt12(item.end)}</span>
                  <span>· {item.room}</span>
                  <span>· from {inviter?.name}</span>
                </div>
              </button>
            );
          })}

          {sent.length > 0 && (
            <>
              <h2 className="pt-2 font-mono text-[11px] uppercase tracking-widest text-slate-500">Sent invitations</h2>
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 divide-y divide-slate-800/70">
                {sent.map((a) => {
                  const item = state.scheduleItems.find((i) => i.id === a.scheduleItemId);
                  const invitee = findUser(state, a.inviteeId);
                  if (!item) return null;
                  return (
                    <div key={a.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-slate-200">{item.title}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">{invitee?.name} · {fmt12(item.start)}</p>
                      </div>
                      <Badge variant="outline" className={`text-[10px] ${a.state === "ACCEPTED" ? "text-emerald-300" : a.state === "DECLINED" ? "text-rose-300" : "text-amber-300"}`}>
                        {a.state.toLowerCase()}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {resolved.length > 0 && (
            <>
              <h2 className="pt-2 font-mono text-[11px] uppercase tracking-widest text-slate-500">Your history</h2>
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 divide-y divide-slate-800/70">
                {resolved.map((a) => {
                  const item = state.scheduleItems.find((i) => i.id === a.scheduleItemId);
                  if (!item) return null;
                  return (
                    <div key={a.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <p className="truncate text-xs text-slate-300">{item.title}</p>
                      <Badge variant="outline" className={`text-[10px] ${a.state === "ACCEPTED" ? "text-emerald-300" : "text-rose-300"}`}>
                        {a.state.toLowerCase()}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>

        <section className="lg:sticky lg:top-40 lg:self-start">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40">
            <header className="flex items-center gap-2 border-b border-slate-800 px-5 py-3.5">
              <UsersThree size={16} className="text-indigo-300" weight="duotone" />
              <h2 className="text-sm font-semibold text-slate-100">Request inspector</h2>
            </header>
            {!selected ? (
              <p className="px-5 py-14 text-center text-sm text-slate-500">Select a request to review its full agenda, attendees and privacy level.</p>
            ) : (
              <motion.div key={selected.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 p-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-slate-50">{selected.item.title}</h3>
                    <Badge variant="outline" className="text-[10px]">{VISIBILITY_META[selected.item.visibility].label}</Badge>
                    {selected.item.urgentOverride && <Badge className="bg-rose-500/15 text-[10px] text-rose-300">Urgent</Badge>}
                  </div>
                  <p className="mt-2 text-sm text-slate-400">{selected.item.agenda}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <Info label="Window" value={`${fmt12(selected.item.start)} – ${fmt12(selected.item.end)}`} />
                  <Info label="Location" value={selected.item.room} />
                  <Info label="Requested by" value={findUser(state, selected.item.ownerId)?.name ?? "Unknown"} />
                  <Info label="Type" value={selected.item.type === "MEETING" ? "Approval required" : "Activity"} />
                </div>

                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Attendees</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selected.item.participantIds.map((pid) => {
                      const u = findUser(state, pid);
                      if (!u) return null;
                      return (
                        <span key={pid} className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-950/50 py-1 pl-1 pr-2.5 text-[11px] text-slate-300">
                          <span className="grid h-5 w-5 place-items-center rounded-full text-[9px] font-semibold text-white" style={{ backgroundColor: u.avatarColor }}>
                            {initials(u.name)}
                          </span>
                          {u.name}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {selected.item.externalGuests.length > 0 && (
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">External guests</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selected.item.externalGuests.map((g) => (
                        <span key={g} className="flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/5 px-2.5 py-1 text-[11px] text-amber-200">
                          <MapPin size={11} /> {g}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950/40 p-3 text-[11px] text-slate-400">
                  <Warning size={14} className="text-amber-300" weight="duotone" />
                  Accepting locks this slot into your calendar. Declining frees the invite for you.
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1 gap-1.5" onClick={() => accept(selected.id, selected.item.title)}>
                    <CheckCircle size={15} weight="duotone" /> Accept &amp; lock
                  </Button>
                  <Button variant="outline" className="flex-1 gap-1.5" onClick={() => decline(selected.id, selected.item.title)}>
                    <XCircle size={15} /> Decline
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
          <p className="mt-3 flex items-center gap-1.5 px-1 font-mono text-[10px] uppercase tracking-widest text-slate-600">
            <PaperPlaneTilt size={12} /> {sent.length} sent · {incoming.length} pending · {resolved.length} resolved
          </p>
        </section>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-2.5">
      <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-1 text-slate-200">{value}</p>
    </div>
  );
}

type Sel = { id: string; item: import("@/types/calendar").ScheduleItem } | null;
function input(state: ReturnType<typeof useApp>, selectedId: string | null, incoming: { id: string; scheduleItemId: string }[]): Sel {
  const ids = incoming.map((a) => a.id);
  const id = selectedId && ids.includes(selectedId) ? selectedId : incoming[0]?.id ?? null;
  if (!id) return null;
  const ap = state.approvals.find((a) => a.id === id);
  if (!ap) return null;
  const item = state.scheduleItems.find((i) => i.id === ap.scheduleItemId);
  return item ? { id, item } : null;
}