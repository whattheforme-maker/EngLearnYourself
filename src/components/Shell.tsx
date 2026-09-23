"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { StatsBar, type StatsBarData } from "./StatsBar";
import { BookIcon, GridIcon, HomeIcon, SparkIcon } from "./Icons";

const NAV = [
  { href: "/", label: "Bosh sahifa", Icon: HomeIcon },
  { href: "/vocabulary", label: "Lug'atim", Icon: BookIcon },
  { href: "/play", label: "O'yinlar", Icon: GridIcon },
];

export function Shell({
  children,
  stats,
}: {
  children: ReactNode;
  stats: StatsBarData;
}) {
  const pathname = usePathname();
  const inGame = pathname.startsWith("/play/");

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 -z-20 bg-night" />
      <div className="dots-bg pointer-events-none fixed inset-0 -z-20 opacity-70" />
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="animate-glow absolute -left-28 -top-32 h-[26rem] w-[26rem] rounded-full bg-grape/45 blur-[130px]" />
        <div className="animate-glow absolute -right-24 top-1/4 h-80 w-80 rounded-full bg-berry/30 blur-[130px]" />
        <div className="absolute bottom-[-6rem] left-1/3 h-80 w-80 rounded-full bg-sky/25 blur-[130px]" />
      </div>

      {!inGame && (
        <header className="sticky top-0 z-30 border-b border-white/10 bg-night/70 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3">
            <Link href="/" className="group flex items-center gap-2.5">
              <span className="relative grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-berry via-tangerine to-coin text-night shadow-lg shadow-berry/30">
                <SparkIcon className="h-5 w-5" />
              </span>
              <span className="leading-none">
                <span className="font-display block text-sm font-extrabold tracking-tight text-white sm:text-lg">
                  English Learn Yourself
                </span>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-grape-soft">
                  LinDuo uslubida
                </span>
              </span>
            </Link>

            <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 md:flex">
              {NAV.map(({ href, label, Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${
                      active
                        ? "bg-white text-night shadow-md"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                );
              })}
            </nav>

            <StatsBar initial={stats} />
          </div>
        </header>
      )}

      <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-5 md:pb-14">{children}</main>

      {!inGame && (
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-night/90 px-4 pb-4 pt-2 backdrop-blur-xl md:hidden">
          <div className="mx-auto flex max-w-md items-stretch justify-between gap-2">
            {NAV.map(({ href, label, Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-bold transition ${
                    active ? "bg-grape/25 text-white" : "text-white/50"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
