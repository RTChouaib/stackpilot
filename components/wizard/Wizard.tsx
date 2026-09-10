"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check, CheckCircle2, Circle, Loader2, Mail } from "lucide-react";
import type { QuestionnaireInput } from "@/lib/ai/schema";

type StepDef =
  | { key: keyof QuestionnaireInput; title: string; type: "single"; options: { id: string; label: string }[] }
  | { key: keyof QuestionnaireInput; title: string; type: "multi"; options: { id: string; label: string }[] }
  | { key: keyof QuestionnaireInput; title: string; type: "bool" }
  | { key: keyof QuestionnaireInput; title: string; type: "text"; placeholder: string };

const STEPS: StepDef[] = [
  { key: "projectType", title: "What are you building?", type: "single", options: [
      { id: "saas", label: "SaaS product" }, { id: "marketplace", label: "Marketplace" },
      { id: "mobile", label: "Mobile app" }, { id: "ai-agent", label: "AI agent" },
      { id: "ecommerce", label: "E-commerce" }, { id: "internal", label: "Internal tool" },
      { id: "content", label: "Content platform" }, { id: "community", label: "Community" },
    ] },
  { key: "idea", title: "Describe the idea in one or two sentences.", type: "text", placeholder: "e.g. A tool that helps freelancers track invoices and get paid faster." },
  { key: "audience", title: "Who is it for?", type: "text", placeholder: "e.g. Freelance designers and consultants" },
  { key: "mainFeature", title: "What is the main feature users will pay for?", type: "text", placeholder: "e.g. Automated invoice reminders" },
  { key: "expectedUsers", title: "Expected users in the first year", type: "single", options: [
      { id: "u100", label: "Under 100" }, { id: "u1000", label: "100 – 1,000" },
      { id: "u10000", label: "1,000 – 10,000" }, { id: "u10000plus", label: "10,000+" },
    ] },
  { key: "techLevel", title: "Your technical level", type: "single", options: [
      { id: "non-technical", label: "Non-technical" }, { id: "beginner", label: "Beginner" },
      { id: "developer", label: "Developer" }, { id: "team", label: "Engineering team" },
    ] },
  { key: "budget", title: "Your launch budget", type: "single", options: [
      { id: "b500", label: "Under €500" }, { id: "b2000", label: "€500 – €2,000" },
      { id: "b10000", label: "€2,000 – €10,000" }, { id: "b10000plus", label: "€10,000+" },
    ] },
  { key: "timeline", title: "Desired launch timeline", type: "single", options: [
      { id: "week", label: "This week" }, { id: "month", label: "1 month" },
      { id: "quarter", label: "3 months" }, { id: "long", label: "6+ months" },
    ] },
  { key: "priorities", title: "Main priorities", type: "multi", options: [
      { id: "cost", label: "Lowest cost" }, { id: "speed", label: "Fastest launch" },
      { id: "ai-quality", label: "Strongest AI quality" }, { id: "privacy", label: "Privacy / EU hosting" },
      { id: "scale", label: "Scalability" }, { id: "open-source", label: "Open source" },
      { id: "maintenance", label: "Easiest maintenance" },
    ] },
  { key: "aiFeature", title: "Will the product use AI?", type: "single", options: [
      { id: "no", label: "No AI needed" }, { id: "chat", label: "Chat assistant" },
      { id: "docs", label: "Document analysis" }, { id: "image", label: "Image generation" },
      { id: "voice", label: "Voice" }, { id: "automation", label: "Automation" },
      { id: "coding", label: "Coding" }, { id: "multiple", label: "Multiple AI features" },
    ] },
  { key: "sensitiveData", title: "Will you handle sensitive data?", type: "single", options: [
      { id: "no", label: "No sensitive data" }, { id: "personal", label: "Personal data" },
      { id: "financial", label: "Financial data" }, { id: "health", label: "Health data" },
      { id: "business", label: "Confidential business data" },
    ] },
  { key: "payments", title: "Do you need payment processing?", type: "bool" },
  { key: "signIn", title: "Do you need users to sign in?", type: "bool" },
  { key: "mobile", title: "Do you need mobile apps now or later?", type: "single", options: [
      { id: "no", label: "No" }, { id: "later", label: "Later" }, { id: "now", label: "Yes, now" },
    ] },
];

// The email-capture screen is a distinct final step, not part of STEPS,
// since it has its own two-button layout ("email me" vs "continue without
// email") instead of the generic single/multi/bool/text question shape.
const EMAIL_STEP_INDEX = STEPS.length;
const TOTAL_SCREENS = STEPS.length + 1;

type Answers = Partial<Record<keyof QuestionnaireInput, unknown>>;

export interface WizardBranding {
  name: string;
  logoUrl?: string;
  accentColor?: string; // hex — falls back to StackPilot blue if unset
}

interface WizardProps {
  /** Set when rendered through an agency's branded route (/w/[slug]). */
  agencySlug?: string;
  branding?: WizardBranding;
}

export default function Wizard({ agencySlug, branding }: WizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({ priorities: [] });
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accent = branding?.accentColor ?? "#4C5FF0";
  const accentDim = `${accent}14`;

  const onEmailStep = step === EMAIL_STEP_INDEX;

  // STEPS is a fixed, non-empty array and `step` is only ever set by this
  // component's own back()/next() handlers, which keep it within range —
  // so indexing is always safe when we're not on the email step.
  const current = onEmailStep ? null : STEPS[step]!;
  const value = current ? answers[current.key] : undefined;

  const isValid = !current
    ? true
    : current.type === "text" || current.type === "multi"
    ? true
    : current.type === "bool"
    ? value === true || value === false
    : Boolean(value);

  const setValue = (v: unknown) => {
    if (!current) return;
    setAnswers((a) => ({ ...a, [current.key]: v }));
  };
  const toggleMulti = (id: string) => {
    if (!current) return;
    setAnswers((a) => {
      const arr = (a[current.key] as string[]) ?? [];
      return { ...a, [current.key]: arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id] };
    });
  };

  const submit = async (withEmail: boolean) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...answers,
          ...(withEmail && consent ? { email } : {}),
          ...(agencySlug ? { agencySlug } : {}),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong generating your blueprint.");
      }
      const { shareToken } = await res.json();
      router.push(`/blueprint/${shareToken}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  const next = () => {
    if (step < EMAIL_STEP_INDEX) setStep(step + 1);
  };
  const back = () => {
    if (step > 0) setStep(step - 1);
  };

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <div className="max-w-2xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
      {branding && (
        <div className="flex items-center gap-2 mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary
              agency-supplied logo URL of unknown dimensions; this is a small,
              admin-configured branding asset, not a performance-sensitive
              image, so next/image's fixed-size/optimization requirements
              aren't worth the complexity here. */}
          {branding.logoUrl && <img src={branding.logoUrl} alt={branding.name} className="h-6" />}
          <span className="text-xs font-mono text-navy-soft">Powered by StackPilot, branded for {branding.name}</span>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <button onClick={back} disabled={step === 0} className="inline-flex items-center gap-1 text-sm font-medium text-navy-soft disabled:opacity-30">
          <ChevronLeft size={16} /> Back
        </button>
        <span className="text-xs font-mono text-navy-soft">Step {step + 1} of {TOTAL_SCREENS}</span>
      </div>

      <div className="w-full h-1.5 rounded-full bg-border mb-10">
        <div
          className="h-1.5 rounded-full transition-all"
          style={{ width: `${((step + 1) / TOTAL_SCREENS) * 100}%`, background: accent }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.2 }}
        >
          {onEmailStep ? (
            <div className="text-center">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto" style={{ background: accentDim }}>
                <Mail size={18} style={{ color: accent }} />
              </div>
              <h2 className="font-head text-2xl font-bold text-navy mt-5">Send my full Stack Blueprint to my inbox.</h2>
              <p className="text-sm mt-2 text-navy-soft">Optional — you can also just view it now.</p>
              <div className="mt-7 text-left max-w-sm mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border-2 border-border px-4 py-3 text-sm focus:outline-none focus:ring-2"
                  style={{ boxShadow: "none" }}
                />
                <label className="flex items-start gap-2 mt-4 text-xs text-navy-soft">
                  <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
                  I agree to receive my blueprint by email and occasional relevant updates. Unsubscribe anytime.
                </label>
              </div>
            </div>
          ) : (
            <>
              <h2 className="font-head text-2xl font-bold text-navy">{current!.title}</h2>
              <div className="mt-7">
                {current!.type === "single" && (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {current!.options.map((o) => (
                      <OptionCard key={o.id} label={o.label} selected={value === o.id} accent={accent} accentDim={accentDim} onClick={() => setValue(o.id)} />
                    ))}
                  </div>
                )}
                {current!.type === "multi" && (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {current!.options.map((o) => (
                      <OptionCard key={o.id} label={o.label} selected={((value as string[]) ?? []).includes(o.id)} accent={accent} accentDim={accentDim} onClick={() => toggleMulti(o.id)} />
                    ))}
                  </div>
                )}
                {current!.type === "bool" && (
                  <div className="grid grid-cols-2 gap-3">
                    <OptionCard label="Yes" selected={value === true} accent={accent} accentDim={accentDim} onClick={() => setValue(true)} />
                    <OptionCard label="No" selected={value === false} accent={accent} accentDim={accentDim} onClick={() => setValue(false)} />
                  </div>
                )}
                {current!.type === "text" && (
                  <textarea
                    className="w-full rounded-xl border-2 border-border p-4 text-sm resize-none focus:outline-none focus:ring-2"
                    style={{ minHeight: 110 }}
                    placeholder={current!.placeholder}
                    value={(value as string) ?? ""}
                    onChange={(e) => setValue(e.target.value)}
                  />
                )}
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {error && (
        <div className="mt-6 px-4 py-3 rounded-xl text-sm bg-amber-dim text-amber">{error}</div>
      )}

      <div className="mt-10 flex justify-end gap-3">
        {onEmailStep ? (
          <>
            <button
              onClick={() => submit(false)}
              disabled={submitting}
              className="text-sm font-medium text-navy-soft px-4 py-3 disabled:opacity-40"
            >
              Continue without email
            </button>
            <button
              onClick={() => submit(true)}
              disabled={!emailValid || !consent || submitting}
              className="text-white rounded-xl px-5 py-3 font-semibold text-sm inline-flex items-center gap-2 disabled:opacity-40"
              style={{ background: "#10193A" }}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Generating your blueprint…
                </>
              ) : (
                <>Email me my blueprint <Check size={16} /></>
              )}
            </button>
          </>
        ) : (
          <button
            onClick={next}
            disabled={!isValid}
            className="text-white rounded-xl px-5 py-3 font-semibold text-sm inline-flex items-center gap-2 disabled:opacity-40"
            style={{ background: "#10193A" }}
          >
            Continue <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

function OptionCard({
  label, selected, onClick, accent, accentDim,
}: { label: string; selected: boolean; onClick: () => void; accent: string; accentDim: string }) {
  return (
    <button
      onClick={onClick}
      className="text-left px-4 py-3.5 rounded-xl border-2 flex items-center justify-between gap-3 transition-colors"
      style={{
        borderColor: selected ? accent : "#E1E4F0",
        background: selected ? accentDim : "#fff",
      }}
    >
      <span className="text-sm font-medium text-navy">{label}</span>
      {selected ? <CheckCircle2 size={18} style={{ color: accent }} /> : <Circle size={18} className="text-border" />}
    </button>
  );
}
