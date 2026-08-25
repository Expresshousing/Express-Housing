import React from "react";

export default function FormPanel() {
  return (
    <form className="mx-auto max-w-xl rounded-[20px] border border-[#ebebeb] bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,.08)] md:p-7">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#ff385c]">Request details</p>
      <h2 className="mt-3 text-[30px] font-extrabold tracking-[-0.035em]">Tell us what you need.</h2>
      <p className="mt-3 text-[13px] leading-relaxed text-[#717171]">Required details are marked. Nothing is submitted until you review.</p>
      <div className="mt-7 space-y-5">
        <div><label htmlFor="name" className="mb-1.5 block text-[13px] font-semibold">Name</label><input id="name" required className="min-h-12 w-full rounded-xl border border-[#ebebeb] bg-[#f7f7f7] px-4 text-base focus:border-[#ff385c] focus:outline-none" /></div>
        <div><label htmlFor="details" className="mb-1.5 block text-[13px] font-semibold">Details</label><textarea id="details" rows={5} className="w-full rounded-xl border border-[#ebebeb] bg-[#f7f7f7] p-4 text-base focus:border-[#ff385c] focus:outline-none" /></div>
        <div role="status" className="rounded-xl border border-[#ff9500]/20 bg-[#ff9500]/[.07] p-3 text-[13px] leading-relaxed">You can review and edit this information before final submission.</div>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" className="min-h-11 rounded-xl border border-[#ebebeb] bg-[#f7f7f7] px-5 text-[15px] font-bold">Cancel</button><button type="submit" className="min-h-11 rounded-xl bg-[#ff385c] px-5 text-[15px] font-bold text-white shadow-[0_8px_24px_rgba(255,56,92,.25)]">Review request</button></div>
      </div>
    </form>
  );
}

