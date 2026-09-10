import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { renderToStream } from "@react-pdf/renderer";
import { db } from "@/lib/db";
import { blueprints } from "@/lib/db/schema";
import { BlueprintDocument } from "@/lib/pdf/BlueprintDocument";
import type { BlueprintOutput } from "@/lib/ai/schema";

export const runtime = "nodejs"; // @react-pdf/renderer requires the Node runtime.

interface RouteParams {
  params: Promise<{ shareToken: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { shareToken } = await params;

  const [blueprint] = await db
    .select()
    .from(blueprints)
    .where(eq(blueprints.shareToken, shareToken))
    .limit(1);

  if (!blueprint || !blueprint.isPublic) {
    return NextResponse.json({ error: "Blueprint not found." }, { status: 404 });
  }

  const recommendations = blueprint.recommendations as {
    lean: BlueprintOutput["lean"];
    balanced: BlueprintOutput["balanced"];
    scaleReady: BlueprintOutput["scaleReady"];
  };
  const aiSetup = (blueprint.aiSetup as BlueprintOutput["aiSetup"]) ?? [];

  const stream = await renderToStream(
    <BlueprintDocument blueprint={blueprint} recommendations={recommendations} aiSetup={aiSetup} />
  );

  // renderToStream returns a Node Readable; Response needs a Web
  // ReadableStream, so adapt it rather than buffering the whole PDF.
  const webStream = new ReadableStream({
    start(controller) {
      stream.on("data", (chunk: Buffer) => controller.enqueue(chunk));
      stream.on("end", () => controller.close());
      stream.on("error", (err) => controller.error(err));
    },
  });

  const filename = `stackpilot-blueprint-${blueprint.projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}.pdf`;

  return new Response(webStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, max-age=0, no-store",
    },
  });
}
