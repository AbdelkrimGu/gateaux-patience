import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import CakeForm from "@/components/admin/CakeForm";
import { BackLink, PageHeader } from "@/components/admin/ui";
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
    <AdminShell>
      <PageHeader
        width="4xl"
        eyebrow={<BackLink href="/admin/cakes">Gâteaux</BackLink>}
        eyebrowOnPhone
        title="Modifier le gâteau"
        subtitle={<span className="block truncate max-w-md">{cake.translations.fr.title || "Sans titre"}</span>}
      />
      <div className="max-w-4xl mx-auto">
        <CakeForm mode="edit" cake={cake} categories={categories} />
      </div>
    </AdminShell>
  );
}
