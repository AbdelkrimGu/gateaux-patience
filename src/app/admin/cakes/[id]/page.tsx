import { requireAdmin } from "@/lib/admin-auth";
import { notFound } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import CakeForm from "@/components/admin/CakeForm";
import { getCakeById } from "@/lib/admin-data";
import { getCategoriesOrEmpty } from "@/lib/categories-data";

export const dynamic = "force-dynamic";

export default async function EditCakePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin();

  const [cake, categories] = await Promise.all([
    getCakeById(id),
    getCategoriesOrEmpty(),
  ]);
  if (!cake) notFound();

  return (
    <AdminShell>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-800">Modifier le gâteau</h1>
          <p className="text-sm text-gray-500 mt-0.5 truncate max-w-md">
            {cake.translations.fr.title || "Sans titre"}
          </p>
        </div>
        <CakeForm mode="edit" cake={cake} categories={categories} />
      </div>
    </AdminShell>
  );
}
