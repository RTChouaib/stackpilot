"use client";

import { useState } from "react";

export default function DeleteMyDataPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/privacy/delete-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setSent(true); // always shown, regardless of whether the email exists — see the API route
  };

  return (
    <main className="max-w-md mx-auto px-5 sm:px-8 py-16">
      <h1 className="font-head text-3xl font-bold text-navy mb-2">Delete my data</h1>
      <p className="text-sm text-navy-soft mb-6">
        This removes every quote request, builder-match request, newsletter signup, and contact
        message tied to your email address. We&apos;ll send a confirmation link first — nothing is
        deleted until you click it.
      </p>
      {sent ? (
        <div className="bg-white border border-border rounded-2xl p-6 text-center">
          <p className="font-medium text-navy">Check your inbox for a confirmation link.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="bg-white border border-border rounded-2xl p-6 flex flex-col gap-3">
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl border-2 border-border px-4 py-2.5 text-sm"
            required
          />
          <button type="submit" disabled={loading} className="bg-navy text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50">
            {loading ? "Sending…" : "Send confirmation link"}
          </button>
        </form>
      )}
    </main>
  );
}
