import { NextRequest, NextResponse } from "next/server";
import { createOrder } from "@/lib/admin-data";
import { clientIp, createRateLimiter } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isString(v: unknown): v is string {
  return typeof v === "string";
}

/** Honeypot: a visually hidden input named `website` (see src/components/ui/README.md). */
const HONEYPOT_FIELD = "website";

const limiter = createRateLimiter({ limit: 5, windowMs: 60_000 });

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  if (!limiter.hit(ip)) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limiter.retryAfter(ip)) } }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // A filled honeypot is a bot: pretend it worked, store nothing.
  const trap = body[HONEYPOT_FIELD];
  if (isString(trap) ? trap.trim() !== "" : trap != null) {
    return NextResponse.json({ ok: true }, { status: 202 });
  }

  const name = isString(body.name) ? body.name.trim() : "";
  const phone = isString(body.phone) ? body.phone.trim() : "";
  const message = isString(body.message) ? body.message.trim() : "";

  if (!name || name.length > 200) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }
  if (!phone || phone.length > 50) {
    return NextResponse.json({ error: "Invalid phone" }, { status: 400 });
  }
  if (message.length > 5000) {
    return NextResponse.json({ error: "Message too long" }, { status: 400 });
  }

  try {
    const order = await createOrder({
      name,
      phone,
      message,
      cakeId: isString(body.cakeId) ? body.cakeId.slice(0, 100) : undefined,
      cakeTitle: isString(body.cakeTitle) ? body.cakeTitle.slice(0, 300) : undefined,
    });
    return NextResponse.json({ ok: true, id: order.id }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/orders]", err);
    return NextResponse.json({ error: "Failed to submit order" }, { status: 500 });
  }
}
