import { describe, it, expect } from "vitest";
import {
  evaluateDeterministicRules,
  constraintsToPromptBlock,
  generateDeterministicBlueprint,
} from "./rules-engine";
import { STACKS } from "./stack-data";
import type { QuestionnaireInput } from "./schema";

function baseInputs(overrides: Partial<QuestionnaireInput> = {}): QuestionnaireInput {
  return {
    projectType: "saas",
    idea: "A tool that helps freelancers track invoices.",
    audience: "Freelancers",
    mainFeature: "Automated invoice reminders",
    expectedUsers: "u1000",
    techLevel: "beginner",
    budget: "b2000",
    timeline: "quarter",
    priorities: [],
    aiFeature: "no",
    sensitiveData: "no",
    payments: true,
    signIn: true,
    mobile: "no",
    ...overrides,
  };
}

// A hosting/database value counts as "EU-guaranteed" if it names an EU
// region or an EU-only provider explicitly. Plain "DigitalOcean" or
// "Vercel" (global, region unspecified) do NOT count.
const EU_GUARANTEED_PATTERN = /(EU|Frankfurt|Hetzner|OVHcloud|Scaleway)/;

describe("evaluateDeterministicRules", () => {
  it("does not require EU hosting when nothing privacy-related is selected", () => {
    const result = evaluateDeterministicRules({ priorities: [], sensitiveData: "no" });
    expect(result.mandatoryEuHosting).toBe(false);
    expect(result.pool).toBe("standard");
  });

  it("requires EU hosting when 'privacy' priority is selected", () => {
    const result = evaluateDeterministicRules({ priorities: ["privacy"], sensitiveData: "no" });
    expect(result.mandatoryEuHosting).toBe(true);
    expect(result.pool).toBe("privacy");
  });

  it.each(["personal", "financial", "health", "business"] as const)(
    "requires EU hosting when sensitiveData is '%s'",
    (sensitiveData) => {
      const result = evaluateDeterministicRules({ priorities: [], sensitiveData });
      expect(result.mandatoryEuHosting).toBe(true);
    }
  );

  it("does not require EU hosting for sensitiveData 'no'", () => {
    const result = evaluateDeterministicRules({ priorities: [], sensitiveData: "no" });
    expect(result.mandatoryEuHosting).toBe(false);
  });

  it("selects the openSource pool when 'open-source' is the only priority", () => {
    const result = evaluateDeterministicRules({ priorities: ["open-source"], sensitiveData: "no" });
    expect(result.pool).toBe("openSource");
    expect(result.mandatoryEuHosting).toBe(false);
  });

  it("keeps mandatoryEuHosting true even when open-source wins the pool selection", () => {
    // This is the conflicting-priorities case: open-source wins the overall
    // pool, but EU hosting must remain mandatory rather than silently
    // dropped because a different priority "took over".
    const result = evaluateDeterministicRules({ priorities: ["open-source", "privacy"], sensitiveData: "no" });
    expect(result.pool).toBe("openSource");
    expect(result.mandatoryEuHosting).toBe(true);
  });

  it("includes explicit required notes when EU hosting is mandatory", () => {
    const result = evaluateDeterministicRules({ priorities: ["privacy"], sensitiveData: "no" });
    expect(result.requiredNotes.length).toBeGreaterThan(0);
    expect(result.requiredNotes.join(" ")).toMatch(/EU/);
  });
});

describe("constraintsToPromptBlock", () => {
  it("says no constraints apply for a plain standard-pool request", () => {
    const constraints = evaluateDeterministicRules({ priorities: [], sensitiveData: "no" });
    const block = constraintsToPromptBlock(constraints);
    expect(block).toMatch(/No mandatory/i);
  });

  it("names the pool and EU requirement when mandatory", () => {
    const constraints = evaluateDeterministicRules({ priorities: ["privacy"], sensitiveData: "no" });
    const block = constraintsToPromptBlock(constraints);
    expect(block).toContain("Mandatory EU hosting: true");
  });
});

describe("generateDeterministicBlueprint — EU hosting enforcement", () => {
  it("uses EU-guaranteed hosting and database for all three tiers when privacy is selected", () => {
    const blueprint = generateDeterministicBlueprint(baseInputs({ priorities: ["privacy"] }));
    for (const tier of ["lean", "balanced", "scaleReady"] as const) {
      expect(blueprint[tier].hosting).toMatch(EU_GUARANTEED_PATTERN);
      expect(blueprint[tier].database).toMatch(EU_GUARANTEED_PATTERN);
    }
  });

  it("uses EU-guaranteed hosting and database when sensitive data is selected, even without the privacy priority", () => {
    const blueprint = generateDeterministicBlueprint(baseInputs({ sensitiveData: "health", priorities: [] }));
    for (const tier of ["lean", "balanced", "scaleReady"] as const) {
      expect(blueprint[tier].hosting).toMatch(EU_GUARANTEED_PATTERN);
      expect(blueprint[tier].database).toMatch(EU_GUARANTEED_PATTERN);
    }
  });

  it("regression: forces EU-guaranteed hosting/database even when open-source ALSO wins the pool", () => {
    // Regression test for the bug caught while writing this suite: the
    // openSource pool's hosting entries ("Hetzner or DigitalOcean", plain
    // "MinIO self-hosted") are not themselves EU-guaranteed. Selecting
    // open-source alongside privacy/sensitive-data must not silently drop
    // the EU requirement.
    const blueprint = generateDeterministicBlueprint(
      baseInputs({ priorities: ["open-source", "privacy"], sensitiveData: "financial" })
    );
    for (const tier of ["lean", "balanced", "scaleReady"] as const) {
      expect(blueprint[tier].hosting).toMatch(EU_GUARANTEED_PATTERN);
      expect(blueprint[tier].database).toMatch(EU_GUARANTEED_PATTERN);
      // Every other field should still reflect the open-source pool.
      expect(blueprint[tier].frontend).toBe(STACKS.openSource[tier === "scaleReady" ? "scale" : tier].frontend);
    }
  });

  it("does not force EU hosting when neither privacy nor sensitive data is selected", () => {
    const blueprint = generateDeterministicBlueprint(baseInputs({ priorities: ["cost"], sensitiveData: "no" }));
    // Standard pool's balanced-tier hosting is "Vercel" — not EU-pattern-matched.
    expect(blueprint.balanced.hosting).toBe(STACKS.standard.balanced.hosting);
  });

  it("marks auth/payments as not needed when the founder opted out, regardless of pool", () => {
    const blueprint = generateDeterministicBlueprint(baseInputs({ payments: false, signIn: false }));
    for (const tier of ["lean", "balanced", "scaleReady"] as const) {
      expect(blueprint[tier].payments).toMatch(/Not needed/);
      expect(blueprint[tier].auth).toMatch(/Not needed/);
    }
  });

  it("returns an empty aiSetup array when no AI feature is selected", () => {
    const blueprint = generateDeterministicBlueprint(baseInputs({ aiFeature: "no" }));
    expect(blueprint.aiSetup).toEqual([]);
  });

  it("returns AI task recommendations scoped to the selected feature", () => {
    const blueprint = generateDeterministicBlueprint(baseInputs({ aiFeature: "coding" }));
    expect(blueprint.aiSetup.length).toBeGreaterThan(0);
    expect(blueprint.aiSetup.every((t) => ["Coding", "Complex reasoning"].includes(t.task))).toBe(true);
  });

  it("produces a valid cost string format for every tier and user bucket", () => {
    const blueprint = generateDeterministicBlueprint(baseInputs());
    for (const tier of ["lean", "balanced", "scaleReady"] as const) {
      expect(blueprint[tier].monthlyCostAt100Users).toMatch(/^€/);
      expect(blueprint[tier].monthlyCostAt1000Users).toMatch(/^€/);
      expect(blueprint[tier].monthlyCostAt10000Users).toMatch(/^€/);
    }
  });
});
