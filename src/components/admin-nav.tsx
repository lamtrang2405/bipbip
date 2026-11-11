import Link from "next/link";
import { logoutAction } from "@/lib/admin-actions";
import { MIGRATION_HINT } from "@/lib/taxonomy";

export type AdminSection = "create" | "category" | "stories" | "taxonomy" | "import";

const SECTIONS: { id: AdminSection; label: string; href: string }[] = [
  { id: "create", label: "Đẩy nội dung", href: "/admin?tab=create" },
  { id: "category", label: "Quản lý theo danh mục", href: "/admin?tab=category" },
  { id: "stories", label: "Quản lý theo truyện", href: "/admin?tab=stories" },
  { id: "taxonomy", label: "Thể loại & Danh mục", href: "/admin/taxonomy" },
  { id: "import", label: "Import Google Sheet", href: "/admin/import" },
];

export function AdminNav({ current, schemaReady = true }: { current: AdminSection; schemaReady?: boolean }) {
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Admin CMS</h1>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          >
            Đăng xuất
          </button>
        </form>
      </div>

      {!schemaReady ? (
        <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
          {MIGRATION_HINT}
        </p>
      ) : null}

      <nav className="mt-6 flex flex-wrap gap-1 border-b border-slate-200 dark:border-slate-700">
        {SECTIONS.map((section) => (
          <Link
            key={section.id}
            href={section.href}
            className={`rounded-t-lg px-4 py-2.5 text-sm font-medium transition ${
              current === section.id
                ? "border border-b-0 border-slate-200 bg-white text-amber-800 dark:border-slate-600 dark:bg-slate-900 dark:text-amber-200"
                : "border border-transparent text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            {section.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
