import { requireAdmin } from "@/lib/admin-auth";
import AdminShell from "@/components/admin/AdminShell";
import CategoriesManager from "@/components/admin/CategoriesManager";
import { getCategoriesOrEmpty } from "@/lib/categories-data";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const categories = await getCategoriesOrEmpty();
  return (
    <AdminShell>
      <CategoriesManager initial={categories} />
    </AdminShell>
  );
}
