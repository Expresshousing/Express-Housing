import React, { useMemo, useState } from "react";
import { ChevronRight, LayoutDashboard, Search, Users } from "lucide-react";

const records = [
  { id: "A-104", name: "Example record", owner: "Sample team", status: "Ready" },
  { id: "A-108", name: "Second record", owner: "Operations", status: "Review" },
];

export default function OperationsDashboard() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const visible = useMemo(() => records.filter((record) => {
    const matchesQuery = Object.values(record).some((value) => value.toLowerCase().includes(query.toLowerCase()));
    return matchesQuery && (filter === "all" || record.status.toLowerCase() === filter);
  }), [filter, query]);

  return (
    <main className="min-h-screen bg-white py-6 text-[#222] md:py-10">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col items-start gap-8 px-4 md:flex-row md:px-6 lg:gap-12">
        <nav className="flex w-full shrink-0 gap-1 overflow-x-auto rounded-2xl border border-[#ebebeb] bg-white p-2 md:sticky md:top-24 md:w-64 md:flex-col md:p-3" aria-label="Workspace">
          <div className="hidden px-3 pb-5 pt-3 md:block"><p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#ff385c]">Workspace</p><p className="mt-2 text-[22px] font-extrabold">Operations</p></div>
          {[{ label: "Overview", icon: LayoutDashboard }, { label: "People", icon: Users }].map(({ label, icon: Icon }, index) => <button key={label} className={`flex min-h-11 shrink-0 items-center gap-2.5 rounded-xl px-3 text-[13px] font-semibold ${index === 0 ? "bg-[#222] text-white" : "text-[#717171]"}`}><Icon size={17} />{label}</button>)}
        </nav>

        <section className="min-w-0 flex-1">
          <header className="border-b border-[#ebebeb] pb-8">
            <div className="flex items-center gap-3"><span className="h-0.5 w-8 bg-[#ff385c]" /><p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#ff385c]">Admin workspace</p></div>
            <h1 className="mt-5 text-[42px] font-extrabold leading-[0.96] md:text-[58px]">Overview</h1>
            <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-[#717171]">See what needs attention and open one focused workspace for the details.</p>
          </header>

          <div className="sticky top-24 z-20 mt-6 rounded-2xl border border-[#ebebeb] bg-white p-3 shadow-[0_8px_24px_rgba(0,0,0,.06)]">
            <label className="relative block"><Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#717171]" /><span className="sr-only">Search records</span><input value={query} onChange={(event) => setQuery(event.target.value)} className="min-h-12 w-full rounded-xl border border-[#ebebeb] bg-[#f7f7f7] pl-11 pr-4 text-base" placeholder="Search records" /></label>
            <div className="mt-3 flex gap-1 overflow-x-auto">{["all", "ready", "review"].map((value) => <button key={value} onClick={() => setFilter(value)} className={`min-h-11 shrink-0 rounded-xl px-4 text-[12px] font-bold capitalize ${filter === value ? "bg-[#222] text-white" : "text-[#717171]"}`}>{value}</button>)}</div>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-[#ebebeb]">
            <div className="hidden grid-cols-[.7fr_1.2fr_1fr_44px] gap-4 border-b border-[#ebebeb] bg-[#f7f7f7] px-5 py-3 text-[9px] font-bold uppercase tracking-[.15em] text-[#717171] md:grid"><span>ID</span><span>Record</span><span>Status</span><span /></div>
            {visible.map((record) => <button key={record.id} className="grid min-h-[78px] w-full grid-cols-[1fr_40px] items-center gap-4 border-t border-[#ebebeb] px-5 py-4 text-left first:border-t-0 md:grid-cols-[.7fr_1.2fr_1fr_44px]"><strong>{record.id}</strong><span className="hidden md:block"><strong className="block text-[13px]">{record.name}</strong><span className="text-[10px] text-[#717171]">{record.owner}</span></span><span className="hidden text-[10px] font-extrabold uppercase tracking-[.06em] text-[#34c759] md:block">{record.status}</span><ChevronRight size={18} className="text-[#717171]" /></button>)}
          </div>
        </section>
      </div>
    </main>
  );
}

