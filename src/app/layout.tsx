import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import ThemeClient from "@/components/ThemeClient";
import AuthStatusClient from "@/components/AuthStatusClient";
import GlobalSearchClient from "@/components/GlobalSearchClient";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Precision AI Scout",
  description: "Thesis-first sourcing and enrichment"
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          <div className="mx-auto w-full max-w-7xl px-4 py-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-[260px_1fr]">
              <aside className="card p-4 md:sticky md:top-6 md:h-[calc(100vh-3rem)] md:overflow-y-auto">
                <Link href="/companies" className="flex items-center gap-3 group px-2 py-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm transition-all duration-200 group-hover:bg-blue-700">
                    P
                  </div>
                  <div className="leading-tight">
                    <div className="text-sm font-semibold text-zinc-950 dark:text-zinc-100">Precision AI Scout</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">Thesis-first sourcing</div>
                  </div>
                </Link>

                <div className="mt-4 px-2">
                  <GlobalSearchClient hrefBase="/companies" />
                </div>

                <nav className="mt-4 space-y-1 px-2 text-sm">
                  <Link href="/companies" className="block rounded-xl px-3 py-2 font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-zinc-900/50 transition-colors">
                    Companies
                  </Link>
                  <Link href="/lists" className="block rounded-xl px-3 py-2 font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-zinc-900/50 transition-colors">
                    Lists
                  </Link>
                  <Link href="/saved" className="block rounded-xl px-3 py-2 font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-zinc-900/50 transition-colors">
                    Saved
                  </Link>
                </nav>

                <div className="mt-6 flex items-center justify-between gap-2 px-2">
                  <ThemeClient />
                  {user ? (
                    <AuthStatusClient email={user.email} />
                  ) : (
                    <Link href="/login" className="btn-primary">
                      Sign in
                    </Link>
                  )}
                </div>
              </aside>

              <main className="min-w-0">
                <div className="space-y-8">{children}</div>
              </main>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
