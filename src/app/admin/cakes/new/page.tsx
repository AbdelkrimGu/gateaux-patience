import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import CakeForm from "@/components/admin/CakeForm";
import { BackLink, PageHeader } from "@/components/admin/ui";
import { getCategories } from "@/lib/categories-data";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function NewCakePage() {
  const cookieStore = await cookies();
  if (!verifySessionToken(cookieStore.get(ADMIN_COOKIE)?.value)) redirect("/admin/login");

  const categories = await getCategories();

  return (
    <AdminShell>
      <PageHeader
        width="4xl"
        eyebrow={<BackLink href="/admin/cakes">Gâteaux</BackLink>}
        eyebrowOnPhone
        title="Nouveau gâteau"
        subtitle="Remplissez les informations ci-dessous pour ajouter un gâteau"
      />
      <div className="max-w-4xl mx-auto">
        <CakeForm mode="new" categories={categories} />
      </div>
    </AdminShell>
  );
}
