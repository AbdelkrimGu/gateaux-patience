import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import CakeForm from "@/components/admin/CakeForm";
import { getCakeById } from "@/lib/admin-data";
import { getCategories } from "@/lib/categories-data";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function EditCakePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  if (!verifySessionToken(cookieStore.get(ADMIN_COOKIE)?.value)) redirect("/admin/login");

  const [cake, categories] = await Promise.all([
    getCakeById(id),
    getCategories(),
  ]);
  if (!cake) notFound();

  return (
    <AdminShell title="Modifier le gâteau">
      {/* CakeForm prints the page title next to its Save button. */}
      <CakeForm mode="edit" cake={cake} categories={categories} />
    </AdminShell>
  );
}
