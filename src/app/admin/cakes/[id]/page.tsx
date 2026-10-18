import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import CakeForm from "@/components/admin/CakeForm";
import { getCakeById } from "@/lib/admin-data";
import { getCategories } from "@/lib/categories-data";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function EditCakePage({ params }: { params: { id: string } }) {
  const cookieStore = await cookies();
  if (!verifySessionToken(cookieStore.get(ADMIN_COOKIE)?.value)) redirect("/admin/login");

  const [cake, categories] = await Promise.all([
    getCakeById(params.id),
    getCategories(),
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
