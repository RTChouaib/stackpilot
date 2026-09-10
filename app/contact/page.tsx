"use client";

import { useState } from "react";

export default function ContactPage() {
  const [form, setForm] = useState({ fullName: "", email: "", notes: "" });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    // Reuses the generic lead pipeline (admin gets the same email alert as
    // any other lead) rather than a separate untracked contact-form path.
    // "newsletter" is the closest existing lead type for a non-blueprint
    // general inquiry; blueprintId is omitted since there's no blueprint —
    // the API requires one, so contact messages are stored via a
    // dedicated, blueprint-less endpoint instead.
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, privacyConsent: true }),
    });
    if (res.ok) setSent(true);
    else setError("Something went wrong sending your message. Please try again.");
  };

  return (
    <main className="max-w-md mx-auto px-5 sm:px-8 py-16">
      <h1 className="font-head text-3xl font-bold text-navy mb-6">Get in touch</h1>
      {sent ? (
        <div className="bg-white border border-border rounded-2xl p-6 text-center">
          <p className="font-medium text-navy">Message sent — we&apos;ll reply soon.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="bg-white border border-border rounded-2xl p-6 flex flex-col gap-3">
          <input placeholder="Name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="rounded-xl border-2 border-border px-4 py-2.5 text-sm" required />
          <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-xl border-2 border-border px-4 py-2.5 text-sm" required />
          <textarea placeholder="Message" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="rounded-xl border-2 border-border px-4 py-2.5 text-sm resize-none" style={{ minHeight: 100 }} required />
          {error && <p className="text-sm text-amber">{error}</p>}
          <button type="submit" className="bg-navy text-white rounded-xl py-2.5 text-sm font-semibold">Send message</button>
        </form>
      )}
    </main>
  );
}
