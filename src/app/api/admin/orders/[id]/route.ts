import { NextRequest, NextResponse } from "next/server";
import { getOrders, saveOrders } from "@/lib/admin-data";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const orders = getOrders();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  orders[idx] = { ...orders[idx], ...body };
  saveOrders(orders);
  return NextResponse.json({ order: orders[idx] });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const orders = getOrders().filter((o) => o.id !== id);
  saveOrders(orders);
  return NextResponse.json({ ok: true });
}
