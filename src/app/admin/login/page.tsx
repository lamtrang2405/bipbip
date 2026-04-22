import { loginAction } from "@/lib/admin-actions";

type AdminLoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const params = await searchParams;
  const showError = params.error === "1";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4">
      <section className="w-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Admin login</h1>
        <p className="mt-2 text-sm text-slate-500">
          Dang nhap tai khoan tac gia de quan ly truyen/chuong.
        </p>

        {showError ? (
          <p className="mt-4 rounded-lg bg-red-950 px-3 py-2 text-sm text-red-200">
            Mat khau khong dung.
          </p>
        ) : null}

        <form action={loginAction} className="mt-5 space-y-3">
          <input
            type="password"
            name="password"
            placeholder="Admin password"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-amber-500 px-4 py-2 font-medium text-white"
          >
            Dang nhap
          </button>
        </form>
      </section>
    </main>
  );
}
