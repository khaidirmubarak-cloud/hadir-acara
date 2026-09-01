import { getSession } from "@/lib/auth";
import LogoutButton from "./logout-button";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    // /admin/login sendiri render tanpa shell (middleware sudah mengizinkan path ini
    // lewat tanpa session; halaman lain di bawah /admin akan di-redirect middleware).
    return <div className="flex flex-1 flex-col">{children}</div>;
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-gray-200 bg-white print:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <a href="/admin" className="text-sm font-semibold text-gray-900">
            Daftar Hadir UIN Palopo
          </a>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <a href="/admin/akun" className="hover:text-gray-900">
              {session.name}
            </a>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 print:max-w-none print:p-0">{children}</main>
    </div>
  );
}
