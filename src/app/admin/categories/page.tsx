import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import CategoriesManager from "@/components/admin/CategoriesManager";
import { getCategories } from "@/lib/categories-data";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const cookieStore = await cookies();
  if (cookieStore.get("admin_session")?.value !== "authenticated") {
    redirect("/admin/login");
  }
  const categories = await getCategories();
  return (
    <AdminShell>
      <CategoriesManager initial={categories} />
    </AdminShell>
  );
}
