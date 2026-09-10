import type { QuestionnaireInput } from "./schema";
import type { BlueprintOutput } from "./schema";
import {
  STACKS,
  TIER_META,
  COST_TABLE,
  AI_COST_ADD,
  LAUNCH_TIME,
  DIFFICULTY,
  AI_TASKS,
  AI_FEATURE_TASK_MAP,
  aiLabelForTier,
  type StackPool,
  type Tier,
} from "./stack-data";

/* ============================================================
   DETERMINISTIC RULE EVALUATION
   ============================================================
   Runs BEFORE the LLM is called. This is the compliance-critical path:
   the model is never allowed to independently decide EU-hosting status —
   it's handed the decision as a hard constraint in the system prompt.
   ============================================================ */

export interface DeterministicConstraints {
  pool: StackPool;
  mandatoryEuHosting: boolean;
  mandatoryEuDatabase: boolean;
  prohibitedRegions: string[];
  requiredNotes: string[];
  reasons: string[];
}

export function evaluateDeterministicRules(
  inputs: Pick<QuestionnaireInput, "priorities" | "sensitiveData">
): DeterministicConstraints {
  const reasons: string[] = [];
  const wantsPrivacy = inputs.priorities?.includes("privacy") ?? false;
  const hasSensitiveData = inputs.sensitiveData && inputs.sensitiveData !== "no";
  const wantsOpenSource = inputs.priorities?.includes("open-source") ?? false;

  if (wantsPrivacy) reasons.push('Founder selected "Privacy / EU hosting" as a priority.');
  if (hasSensitiveData) reasons.push(`Founder indicated handling of ${inputs.sensitiveData} data.`);

  const mandatoryEu = wantsPrivacy || Boolean(hasSensitiveData);

  let pool: StackPool = "standard";
  if (wantsOpenSource) pool = "openSource";
  else if (mandatoryEu) pool = "privacy";

  return {
    pool,
    mandatoryEuHosting: mandatoryEu,
    mandatoryEuDatabase: mandatoryEu,
    prohibitedRegions: mandatoryEu ? ["us-east", "us-west", "ap-southeast", "global-non-eu"] : [],
    requiredNotes: mandatoryEu
      ? [
          "Database must be hosted in an EU region (e.g. Supabase EU Frankfurt) or self-hosted on EU infrastructure (e.g. Hetzner).",
          "Do not recommend hosting regions outside the EU for any tier.",
          "Prefer providers with GDPR-aligned data processing agreements.",
        ]
      : [],
    reasons,
  };
}

/**
 * Renders the deterministic constraints as a delimited block for injection
 * into the AI system prompt. Kept separate from the constraints object so
 * the object itself stays easy to unit test.
 */
export function constraintsToPromptBlock(constraints: DeterministicConstraints): string {
  if (!constraints.mandatoryEuHosting && constraints.pool === "standard") {
    return "No mandatory hosting-region constraints apply to this request.";
  }
  const lines = [
    `Stack pool: ${constraints.pool}`,
    `Mandatory EU hosting: ${constraints.mandatoryEuHosting}`,
    `Mandatory EU database: ${constraints.mandatoryEuDatabase}`,
    constraints.prohibitedRegions.length
      ? `Prohibited regions: ${constraints.prohibitedRegions.join(", ")}`
      : null,
    ...constraints.requiredNotes,
  ].filter(Boolean);
  return lines.join("\n");
}

/* ============================================================
   DETERMINISTIC FALLBACK GENERATOR
   ============================================================
   Used when the LLM call fails, times out, or the caller is rate-limited.
   Produces a fully valid BlueprintOutput from the same static data pools
   the AI prompt is grounded in, so a degraded response is still accurate
   and on-brand rather than an error page.
   ============================================================ */

function costRange(tier: Tier, needsAI: boolean): [number, number, number] {
  const base = COST_TABLE[tier];
  const add = AI_COST_ADD[tier];
  return needsAI
    ? [base[0] + add[0], base[1] + add[1], base[2] + add[2]]
    : [...base];
}

function formatCost(v: number): string {
  return v === 0 ? "€0" : `€${v.toLocaleString()}/mo`;
}

function whyFits(tier: Tier, inputs: QuestionnaireInput, pool: StackPool): string {
  const bits: string[] = [];
  if (tier === "lean") {
    bits.push("keeps upfront cost close to zero, fitting a tighter launch budget");
    if (inputs.techLevel === "non-technical" || inputs.techLevel === "beginner") {
      bits.push("uses tools with gentle learning curves");
    }
  } else if (tier === "balanced") {
    bits.push("is the stack most funded early-stage products run on, so it's well-documented and easy to hire for");
    bits.push("leaves room to grow without a rebuild");
  } else {
    bits.push("is built for teams, with clearer ownership boundaries between services");
    if (inputs.expectedUsers === "u10000plus") bits.push("is sized for 10,000+ users from day one");
  }
  if (pool === "privacy") bits.push("keeps data in EU-hosted or self-hostable services given the stated privacy needs");
  if (pool === "openSource") bits.push("favors open-source components in line with the stated priority");
  return `This option ${bits.join(", ")}.`;
}

function tradeoffs(tier: Tier): string[] {
  if (tier === "lean") {
    return ["Likely to be outgrown past a few thousand users.", "Fewer built-in guardrails, so more manual QA is needed."];
  }
  if (tier === "balanced") {
    return ["Costs step up noticeably past a few thousand active users.", "Still requires some engineering judgment."];
  }
  return ["Higher fixed cost even before significant usage.", "Needs production infrastructure experience to run well."];
}

function buildTier(
  tier: Tier,
  inputs: QuestionnaireInput,
  pool: StackPool,
  mandatoryEuHosting: boolean
): BlueprintOutput["lean"] {
  const base = STACKS[pool][tier];
  const needsAI = inputs.aiFeature !== "no";
  const costs = costRange(tier, needsAI);

  // The "openSource" pool's hosting/database entries (e.g. "Hetzner or
  // DigitalOcean", "MinIO self-hosted" with no region specified) are NOT
  // guaranteed EU. If a founder selects both "open source" AND
  // "privacy/EU hosting" (or sensitive data), open-source wins the overall
  // pool for every other field, but hosting/database specifically must
  // still come from the "privacy" pool's entries, which are curated to
  // name only EU-guaranteed infrastructure (Hetzner, Supabase EU Frankfurt,
  // etc). This is what makes the EU constraint actually mandatory rather
  // than best-effort when priorities conflict.
  const hostingSource = mandatoryEuHosting ? STACKS.privacy[tier] : base;

  return {
    frontend: base.frontend,
    backend: base.backend,
    database: hostingSource.database,
    auth: inputs.signIn ? base.auth : "Not needed — no sign-in selected",
    hosting: hostingSource.hosting,
    storage: base.storage,
    payments: inputs.payments ? base.payments : "Not needed — no payment processing selected",
    analytics: base.analytics,
    email: base.email,
    aiProvider: aiLabelForTier(inputs.aiFeature, tier, pool),
    monthlyCostAt100Users: formatCost(costs[0]),
    monthlyCostAt1000Users: formatCost(costs[1]),
    monthlyCostAt10000Users: formatCost(costs[2]),
    estimatedLaunchTime: LAUNCH_TIME[tier][inputs.timeline],
    difficultyLevel: DIFFICULTY[tier] as "Beginner-friendly" | "Intermediate" | "Requires an experienced team",
    whyItFits: whyFits(tier, inputs, pool),
    mainTradeoffs: tradeoffs(tier),
  };
}

export function generateDeterministicBlueprint(inputs: QuestionnaireInput): BlueprintOutput {
  const constraints = evaluateDeterministicRules(inputs);
  const pool = constraints.pool;
  const needsAI = inputs.aiFeature !== "no";
  const taskIds = needsAI ? AI_FEATURE_TASK_MAP[inputs.aiFeature] ?? [] : [];
  const aiSetup = AI_TASKS.filter((t) => taskIds.includes(t.id)).map((t) => ({
    task: t.task,
    recommendedModel: t.model,
    bestFor: t.bestFor,
    qualityRating: t.quality,
    speedRating: t.speed,
    costRating: t.cost,
    privacyConsiderations: t.privacy,
    lowerCostAlternative: t.cheaperAlternative,
    higherQualityAlternative: t.higherQualityAlternative,
    plainLanguageExplanation: t.explanation,
  }));

  return {
    projectName: inputs.mainFeature || inputs.idea.slice(0, 60) || "Your product",
    lean: buildTier("lean", inputs, pool, constraints.mandatoryEuHosting),
    balanced: buildTier("balanced", inputs, pool, constraints.mandatoryEuHosting),
    scaleReady: buildTier("scale", inputs, pool, constraints.mandatoryEuHosting),
    aiSetup,
    architectureNotes: `Requests flow from users through ${STACKS[pool].balanced.frontend.split(" ")[0]} to ${STACKS[pool].balanced.backend}, backed by ${STACKS[pool].balanced.database}.`,
  };
}

export { TIER_META };
