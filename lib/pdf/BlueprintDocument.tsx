import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import type { BlueprintOutput } from "@/lib/ai/schema";
import type { Blueprint } from "@/lib/db/schema";

const COLORS = {
  navy: "#10193A",
  navySoft: "#545E7D",
  border: "#E1E4F0",
  blue: "#4C5FF0",
  surfaceAlt: "#EEF1FB",
};

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, color: COLORS.navy, fontFamily: "Helvetica" },
  headerLabel: { fontSize: 9, color: COLORS.navySoft, marginBottom: 4, letterSpacing: 0.5 },
  title: { fontSize: 22, fontWeight: 700, marginBottom: 4 },
  subtitle: { fontSize: 11, color: COLORS.navySoft, marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: 700, marginTop: 18, marginBottom: 8 },
  tierBlock: { border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: 12, marginBottom: 12 },
  tierName: { fontSize: 13, fontWeight: 700, marginBottom: 2 },
  tierTagline: { fontSize: 9, color: COLORS.navySoft, marginBottom: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, borderBottom: `0.5px solid ${COLORS.border}` },
  rowLabel: { color: COLORS.navySoft, width: 140 },
  rowValue: { flex: 1, fontWeight: 600 },
  costRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8, marginBottom: 4 },
  costBox: { backgroundColor: COLORS.surfaceAlt, borderRadius: 4, padding: 6, width: "31%", textAlign: "center" },
  costLabel: { fontSize: 8, color: COLORS.navySoft },
  costValue: { fontSize: 11, fontWeight: 700, marginTop: 2 },
  aiTaskBlock: { marginBottom: 10, paddingBottom: 8, borderBottom: `0.5px solid ${COLORS.border}` },
  aiTaskTitle: { fontSize: 11, fontWeight: 700 },
  aiTaskModel: { fontSize: 10, color: COLORS.blue, fontWeight: 600, marginBottom: 2 },
  footer: { position: "absolute", bottom: 24, left: 40, right: 40, fontSize: 8, color: COLORS.navySoft, textAlign: "center" },
});

const TIER_LABELS: Record<"lean" | "balanced" | "scaleReady", string> = {
  lean: "Lean MVP",
  balanced: "Balanced Recommendation",
  scaleReady: "Scale-ready",
};

const FIELD_ROWS: Array<[keyof BlueprintOutput["lean"], string]> = [
  ["frontend", "Frontend"],
  ["backend", "Backend / API"],
  ["database", "Database"],
  ["auth", "Authentication"],
  ["hosting", "Hosting"],
  ["storage", "File storage"],
  ["payments", "Payments"],
  ["analytics", "Analytics"],
  ["email", "Email & notifications"],
  ["aiProvider", "AI provider"],
];

interface BlueprintDocumentProps {
  blueprint: Blueprint;
  recommendations: {
    lean: BlueprintOutput["lean"];
    balanced: BlueprintOutput["balanced"];
    scaleReady: BlueprintOutput["scaleReady"];
  };
  aiSetup: BlueprintOutput["aiSetup"];
}

export function BlueprintDocument({ blueprint, recommendations, aiSetup }: BlueprintDocumentProps) {
  const generatedOn = new Date(blueprint.createdAt).toLocaleDateString("en-GB", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <Document title={`StackPilot Blueprint — ${blueprint.projectName}`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.headerLabel}>STACKPILOT BLUEPRINT · GENERATED {generatedOn.toUpperCase()}</Text>
        <Text style={styles.title}>{blueprint.projectName}</Text>
        <Text style={styles.subtitle}>stackpilot.app/blueprint/{blueprint.shareToken}</Text>

        {(["lean", "balanced", "scaleReady"] as const).map((tierKey) => {
          const tier = recommendations[tierKey];
          return (
            <View key={tierKey} style={styles.tierBlock} wrap={false}>
              <Text style={styles.tierName}>{TIER_LABELS[tierKey]}</Text>
              <Text style={styles.tierTagline}>
                {tier.estimatedLaunchTime} · {tier.difficultyLevel}
              </Text>

              {FIELD_ROWS.map(([key, label]) => (
                <View key={key} style={styles.row}>
                  <Text style={styles.rowLabel}>{label}</Text>
                  <Text style={styles.rowValue}>{String(tier[key])}</Text>
                </View>
              ))}

              <View style={styles.costRow}>
                <View style={styles.costBox}>
                  <Text style={styles.costLabel}>100 USERS</Text>
                  <Text style={styles.costValue}>{tier.monthlyCostAt100Users}</Text>
                </View>
                <View style={styles.costBox}>
                  <Text style={styles.costLabel}>1,000 USERS</Text>
                  <Text style={styles.costValue}>{tier.monthlyCostAt1000Users}</Text>
                </View>
                <View style={styles.costBox}>
                  <Text style={styles.costLabel}>10,000 USERS</Text>
                  <Text style={styles.costValue}>{tier.monthlyCostAt10000Users}</Text>
                </View>
              </View>

              <Text style={{ marginTop: 6, color: COLORS.navySoft }}>{tier.whyItFits}</Text>
            </View>
          );
        })}

        {aiSetup && aiSetup.length > 0 && (
          <View break>
            <Text style={styles.sectionTitle}>Best AI setup for your product</Text>
            {aiSetup.map((task, i) => (
              <View key={i} style={styles.aiTaskBlock}>
                <Text style={styles.aiTaskTitle}>{task.task}</Text>
                <Text style={styles.aiTaskModel}>{task.recommendedModel}</Text>
                <Text style={{ color: COLORS.navySoft }}>{task.bestFor}</Text>
                <Text style={{ marginTop: 3 }}>{task.plainLanguageExplanation}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.footer} fixed>
          Generated by StackPilot · Recommendations are informational and not a substitute for professional technical advice.
        </Text>
      </Page>
    </Document>
  );
}
