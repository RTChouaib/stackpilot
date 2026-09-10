import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { deletionRequests, leads, users } from "@/lib/db/schema";

interface PageProps {
  params: Promise<{ token: string }>;
}

/**
 * Server Component that performs the deletion directly on render (a GET
 * request to this page IS the confirmation — there's no separate button to
 * click, matching the single-click confirmation links used by most
 * unsubscribe/deletion flows). Idempotent: re-visiting an already-completed
 * link is a no-op that still reports success.
 */
export default async function ConfirmDeletePage({ params }: PageProps) {
  const { token } = await params;

  const [reqRow] = await db.select().from(deletionRequests).where(eq(deletionRequests.token, token)).limit(1);

  if (!reqRow) {
    return (
      <main className="max-w-md mx-auto px-5 sm:px-8 py-24 text-center">
        <h1 className="font-head text-2xl font-bold text-navy">Link not found</h1>
        <p className="text-sm text-navy-soft mt-2">This confirmation link is invalid or has already been used.</p>
      </main>
    );
  }

  if (reqRow.status !== "completed") {
    await db.delete(leads).where(eq(leads.email, reqRow.email));
    await db.delete(users).where(and(eq(users.email, reqRow.email), eq(users.role, "user")));
    await db
      .update(deletionRequests)
      .set({ status: "completed", confirmedAt: new Date(), completedAt: new Date() })
      .where(eq(deletionRequests.id, reqRow.id));
  }

  return (
    <main className="max-w-md mx-auto px-5 sm:px-8 py-24 text-center">
      <h1 className="font-head text-2xl font-bold text-navy">Data deleted</h1>
      <p className="text-sm text-navy-soft mt-2">
        Every record tied to {reqRow.email} has been removed.
      </p>
    </main>
  );
}
