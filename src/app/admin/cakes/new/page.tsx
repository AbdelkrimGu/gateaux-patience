import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import CakeForm from "@/components/admin/CakeForm";
import { getCategories } from "@/lib/categories-data";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function NewCakePage() {
  const cookieStore = await cookies();
  if (!verifySessionToken(cookieStore.get(ADMIN_COOKIE)?.value)) redirect("/admin/login");

  const categories = await getCategories();

  return (
    <AdminShell>
      {/* CakeForm prints the page title next to its Save button. */}
      <CakeForm mode="new" categories={categories} />
    </AdminShell>
  );
}
