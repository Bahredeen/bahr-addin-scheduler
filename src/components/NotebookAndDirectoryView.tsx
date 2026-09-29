import { useState } from "react";
import { motion } from "framer-motion";
import {
  Buildings, CheckCircle, IdentificationCard, MagnifyingGlass, NotePencil,
  Phone, Plus, ShieldCheck, Trash, UserPlus, UsersThree,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { actions, findUser, useApp } from "@/services/mockDataAndStore";
import { CATEGORY_META, VISIBILITY_META, type NotebookCategory } from "@/types/calendar";

const initials = (n: string) => n.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
const ago = (ts: number) => {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
};

export default function NotebookAndDirectoryView() {
  const state = useApp();
  const me = findUser(state, state.currentUserId);
  const [pane, setPane] = useState<"notebook" | "directory" | "groups">("notebook");
  const [cat, setCat] = useState<string>("ALL");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [newCat, setNewCat] = useState<NotebookCategory>("PLANT_FLOOR");
  const [query, setQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState<string>("ALL");
  if (!me) return null;

  const categories = ["ALL", ...Array.from(new Set(state.notebook.map((n) => n.category)))];
  const entries = cat === "ALL" ? state.notebook : state.notebook.filter((n) => n.category === cat);

  const users = state.users.filter((u) => {
    const matchesGroup = groupFilter === "ALL" || u.groupIds.includes(groupFilter);
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || u.name.toLowerCase().includes(q) || u.role.toLowerCase().includes(q) || u.department.toLowerCase().includes(q);
    return matchesGroup && matchesQuery;
  });

  const pendingJoins = state.joinRequests.filter((j) => j.groupId === state.currentGroupId && j.state === "PENDING");
  const isManager = me.isManager;

  const addEntry = () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Add both a title and the details before saving");
      return;
    }
    actions.addNotebookEntry({
      category: newCat,
      title: title.trim(),
      body: body.trim(),
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
    });
    toast.success("Log entry saved to the shared notebook");
    setTitle("");
    setBody("");
    setTags("");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-50">Notebook &amp; Directory</h1>
          <p className="mt-1 text-sm text-slate-400">Log shift knowledge, browse the company directory and manage group membership.</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-slate-800 bg-slate-950/50 p-1">
          {([
            { k: "notebook" as const, label: "Notebook", icon: NotePencil },
            { k: "directory" as const, label: "Directory", icon: UsersThree },
            { k: "groups" as const, label: "Groups", icon: Buildings },
          ]).map((p) => (
            <button
              key={p.k}
              onClick={() => setPane(p.k)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${pane === p.k ? "bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-400/30" : "text-slate-400 hover:text-slate-200"}`}
            >
              <p.icon size={14} weight="duotone" /> {p.label}
            </button>
          ))}
        </div>
      </div>

      {pane === "notebook" && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <section className="space-y-4">
            <div className="flex flex-wrap gap-1.5">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition ${cat === c ? "border-slate-100 bg-slate-100 text-slate-900" : "border-slate-800 text-slate-400 hover:text-slate-200"}`}
                >
                  {c === "ALL" ? "All logs" : CATEGORY_META[c as NotebookCategory]?.label ?? c}
                </button>
              ))}
            </div>

            {entries.length === 0 && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center text-sm text-slate-500">No log entries in this category yet.</div>
            )}

            {entries.map((n, idx) => {
              const author = findUser(state, n.authorId);
              return (
                <motion.article
                  key={n.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="rounded-xl border border-slate-800 bg-slate-900/40 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-8 w-8 place-items-center rounded-full text-[11px] font-semibold text-white" style={{ backgroundColor: author?.avatarColor ?? "#475569" }}>
                        {initials(author?.name ?? "NA")}
                      </span>
                      <div className="leading-tight">
                        <p className="text-xs font-medium text-slate-200">{author?.name ?? "Unknown"}</p>
                        <p className="font-mono text-[10px] text-slate-500">{CATEGORY_META[n.category]?.label ?? n.category} · {ago(n.createdAt)}</p>
                      </div>
                    </div>
                    {n.authorId === me.id && (
                      <button onClick={() => { actions.deleteNotebookEntry(n.id); toast.info("Log entry removed"); }} className="text-slate-500 transition hover:text-rose-300">
                        <Trash size={14} />
                      </button>
                    )}
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-slate-100">{n.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{n.body}</p>
                  {n.tags.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {n.tags.map((t) => <Badge key={t} variant="outline" className="font-mono text-[10px] text-slate-400">#{t}</Badge>)}
                    </div>
                  )}
                </motion.article>
              );
            })}
          </section>

          <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 lg:sticky lg:top-40 lg:self-start">
            <div className="flex items-center gap-2">
              <Plus size={16} className="text-indigo-300" weight="duotone" />
              <h2 className="text-sm font-semibold text-slate-100">New log entry</h2>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(CATEGORY_META) as NotebookCategory[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setNewCat(c)}
                  className={`rounded-md px-2.5 py-1.5 text-[11px] font-medium transition ${newCat === c ? "bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-400/30" : "border border-slate-800 text-slate-400 hover:text-slate-200"}`}
                >
                  {CATEGORY_META[c].label}
                </button>
              ))}
            </div>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Entry title" className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-indigo-500/50" />
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} placeholder="What happened, what was decided, what comes next..." className="w-full resize-none rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-indigo-500/50" />
            <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="tags, comma separated" className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-indigo-500/50" />
            <Button className="w-full gap-1.5" onClick={addEntry}><NotePencil size={15} weight="duotone" /> Save entry</Button>
          </section>
        </div>
      )}

      {pane === "directory" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[220px]">
              <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search people, roles, departments" className="w-full rounded-lg border border-slate-800 bg-slate-950/60 py-2 pl-9 pr-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-indigo-500/50" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setGroupFilter("ALL")} className={`rounded-md px-2.5 py-1.5 text-[11px] font-medium transition ${groupFilter === "ALL" ? "bg-slate-100 text-slate-900" : "border border-slate-800 text-slate-400 hover:text-slate-200"}`}>All companies</button>
              {state.groups.map((g) => (
                <button key={g.id} onClick={() => setGroupFilter(g.id)} className={`rounded-md px-2.5 py-1.5 text-[11px] font-medium transition ${groupFilter === g.id ? "bg-slate-100 text-slate-900" : "border border-slate-800 text-slate-400 hover:text-slate-200"}`}>{g.name}</button>
              ))}
            </div>
          </div>

          {users.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-10 text-center text-sm text-slate-500">
              <UsersThree size={22} className="mx-auto mb-2 text-slate-600" weight="duotone" />
              No directory matches for that search.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {users.map((u) => {
                const g = state.groups.find((x) => x.id === u.groupId);
                const joined = u.groupIds.includes(state.currentGroupId);
                return (
                  <div key={u.id} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                    <div className="flex items-start gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-full text-xs font-semibold text-white" style={{ backgroundColor: u.avatarColor }}>{initials(u.name)}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-medium text-slate-100">{u.name}</p>
                          {u.verified && <ShieldCheck size={14} className="shrink-0 text-emerald-400" weight="fill" />}
                        </div>
                        <p className="truncate text-[11px] text-slate-400">{u.role} · {u.department}</p>
                      </div>
                      {u.id === me.id && <Badge variant="outline" className="text-[10px]">You</Badge>}
                    </div>
                    <div className="mt-3 space-y-1.5 text-[11px] text-slate-400">
                      <p className="flex items-center gap-1.5"><IdentificationCard size={12} /> {u.email}</p>
                      <p className="flex items-center gap-1.5"><Phone size={12} /> {u.phone}</p>
                      <p className="flex items-center gap-1.5"><Buildings size={12} /> {g?.name} · {VISIBILITY_META[u.visibility].label}</p>
                    </div>
                    {isManager && u.id !== me.id && !u.verified && (
                      <Button variant="outline" size="sm" className="mt-3 w-full gap-1.5" onClick={() => { actions.verifyUser(u.id); toast.success(`${u.name} marked as verified`); }}>
                        <CheckCircle size={14} weight="duotone" /> Verify employee
                      </Button>
                    )}
                    {!joined && u.id !== me.id && (
                      <Button variant="outline" size="sm" className="mt-3 w-full gap-1.5" onClick={() => { actions.requestJoin(u.groupId); toast.info(`Join request sent to ${g?.name}`); }}>
                        <UserPlus size={14} /> Request to join
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {pane === "groups" && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <section className="grid gap-3 sm:grid-cols-2">
            {state.groups.map((g) => {
              const members = state.users.filter((u) => u.groupIds.includes(g.id));
              const joined = me.groupIds.includes(g.id);
              const requested = state.joinRequests.some((j) => j.groupId === g.id && j.userId === me.id && j.state === "PENDING");
              return (
                <div key={g.id} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-500/15 text-indigo-300">
                        <Buildings size={15} weight="duotone" />
                      </span>
                      <div className="leading-tight">
                        <p className="text-sm font-medium text-slate-100">{g.name}</p>
                        <p className="font-mono text-[10px] text-slate-500">{g.joinCode}</p>
                      </div>
                    </div>
                    {g.id === state.currentGroupId && <Badge className="bg-indigo-500/20 text-indigo-200 text-[10px]">Active</Badge>}
                  </div>
                  <p className="mt-2 text-[11px] text-slate-400">{g.industry}</p>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1.5"><UsersThree size={12} /> {members.length} members</span>
                    <span>{joined ? "Member" : requested ? "Request pending" : "Not a member"}</span>
                  </div>
                  {!joined && (
                    <Button variant="outline" size="sm" className="mt-3 w-full gap-1.5" disabled={requested} onClick={() => { actions.requestJoin(g.id); toast.info(`Join request sent to ${g.name}`); }}>
                      <UserPlus size={14} /> {requested ? "Awaiting approval" : "Request to join"}
                    </Button>
                  )}
                </div>
              );
            })}
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-amber-300" weight="duotone" />
              <h2 className="text-sm font-semibold text-slate-100">Join requests</h2>
              {pendingJoins.length > 0 && <Badge className="bg-amber-500/15 text-amber-200 text-[10px]">{pendingJoins.length}</Badge>}
            </div>
            {!isManager ? (
              <p className="mt-3 text-xs text-slate-500">Approval is handled by your company HR manager. Your pending requests appear on the group cards.</p>
            ) : pendingJoins.length === 0 ? (
              <p className="mt-3 text-xs text-slate-500">No pending membership requests for {state.groups.find((g) => g.id === state.currentGroupId)?.name}.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {pendingJoins.map((j) => {
                  const u = findUser(state, j.userId);
                  return (
                    <li key={j.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="grid h-8 w-8 place-items-center rounded-full text-[11px] font-semibold text-white" style={{ backgroundColor: u?.avatarColor ?? "#475569" }}>{initials(u?.name ?? "NA")}</span>
                        <div className="min-w-0 leading-tight">
                          <p className="truncate text-xs font-medium text-slate-200">{u?.name}</p>
                          <p className="truncate text-[11px] text-slate-500">{u?.role} · {u?.department}</p>
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <Button size="sm" className="h-7 gap-1 px-2.5 text-[11px]" onClick={() => { actions.approveJoin(j.id); toast.success(`${u?.name} added to the group`); }}>
                          <CheckCircle size={13} weight="duotone" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 px-2.5 text-[11px]" onClick={() => { actions.rejectJoin(j.id); toast.info("Request rejected"); }}>
                          Decline
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}