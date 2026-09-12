import { ImageResponse } from "@vercel/og";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { blueprints } from "@/lib/db/schema";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const shareToken = searchParams.get("token");

  let title = "Choose the right stack before you build.";
  let subtitle = "AI-generated tech stack, cost estimate, and launch plan.";

  if (shareToken) {
    const [blueprint] = await db
      .select({ projectName: blueprints.projectName })
      .from(blueprints)
      .where(eq(blueprints.shareToken, shareToken))
      .limit(1);
    if (blueprint) {
      title = blueprint.projectName;
      subtitle = "A StackPilot blueprint — tech stack, AI setup, costs, and launch plan.";
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#F6F7FB",
          backgroundImage:
            "linear-gradient(rgba(76,95,240,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(76,95,240,0.10) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          padding: "64px",
          fontFamily: "Arial",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 48, height: 48, borderRadius: 12, background: "#10193A",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: 24,
            }}
          >
            ✦
          </div>
          <span style={{ fontSize: 28, fontWeight: 700, color: "#10193A" }}>StackPilot</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", maxWidth: 900 }}>
          <span style={{ fontSize: 56, fontWeight: 700, color: "#10193A", lineHeight: 1.15 }}>{title}</span>
          <span style={{ fontSize: 26, color: "#545E7D", marginTop: 20 }}>{subtitle}</span>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          {["Lean MVP", "Balanced", "Scale-ready"].map((label) => (
            <div
              key={label}
              style={{
                padding: "10px 20px", borderRadius: 999, background: "#E8EAFD",
                color: "#4C5FF0", fontSize: 18, fontWeight: 600, display: "flex",
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
