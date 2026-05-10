import { NextRequest, NextResponse } from "next/server";
import { getOrders, saveOrders, generateId, type Order } from "@/lib/admin-data";

export async function GET() {
  const orders = getOrders();
  return NextResponse.json({ orders });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const orders = getOrders();

  const newOrder: Order = {
    id: generateId(),
    cakeId: body.cakeId,
    cakeTitle: body.cakeTitle,
    name: body.name || "",
    phone: body.phone || "",
    message: body.message || "",
    status: "new",
    createdAt: new Date().toISOString(),
  };

  orders.unshift(newOrder);
  saveOrders(orders);

  return NextResponse.json({ order: newOrder }, { status: 201 });
}
