import { requireAdmin } from "@/lib/admin-auth";
import AdminShell from "@/components/admin/AdminShell";
import CakeForm from "@/components/admin/CakeForm";
import { getCategoriesOrEmpty } from "@/lib/categories-data";

export const dynamic = "force-dynamic";

export default async function NewCakePage() {
  await requireAdmin();

  const categories = await getCategoriesOrEmpty();

  return (
    <AdminShell>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-800">Nouveau gâteau</h1>
          <p className="text-sm text-gray-500 mt-0.5">Remplissez les informations ci-dessous pour ajouter un gâteau</p>
        </div>
        <CakeForm mode="new" categories={categories} />
      </div>
    </AdminShell>
  );
}
