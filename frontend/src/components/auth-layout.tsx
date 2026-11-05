import Link from "next/link";
import type { ReactNode } from "react";
import { ContourLines, IngressLogo } from "@/components/graphics";
import { IconActivity, IconLayers, IconShield } from "@/components/icons";

const POINTS = [
  { icon: <IconLayers size={18} />, title: "One workspace per organization", body: "Projects, tasks and people, kept cleanly separated." },
  { icon: <IconShield size={18} />, title: "Role-based access", body: "Owners, admins and members see exactly what they should." },
  { icon: <IconActivity size={18} />, title: "Live by default", body: "Every change reaches your team the moment it happens." },
];

/** Split layout for authentication flows: brand panel + focused form column. */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen bg-surface lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <aside className="ing-depth relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16" aria-label="About Ingress">
        <ContourLines className="pointer-events-none absolute inset-0 h-full w-full" opacity={0.16} />
        <div className="relative">
          <Link href="/" aria-label="Ingress home" className="inline-block rounded-md">
            <IngressLogo size={34} tone="light" />
          </Link>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-[34px] font-semibold leading-[1.15] tracking-[-0.025em] text-white">
            Clear workflows for organizations that move with purpose.
          </h2>
          <ul className="mt-10 grid gap-6">
            {POINTS.map((p) => (
              <li key={p.title} className="flex gap-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/15 text-white ring-1 ring-inset ring-white/25" aria-hidden>
                  {p.icon}
                </span>
                <div>
                  <div className="text-[14.5px] font-semibold text-white">{p.title}</div>
                  <div className="mt-0.5 text-[13.5px] text-white/80">{p.body}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative text-[12.5px] text-white/70">© {new Date().getFullYear()} Ingress. All rights reserved.</div>
      </aside>

      <main id="main" className="ing-water flex min-h-screen flex-col lg:bg-none lg:bg-surface">
        <div className="flex items-center justify-between px-6 py-5 sm:px-10 lg:hidden">
          <Link href="/" aria-label="Ingress home">
            <IngressLogo size={30} />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 pb-12 pt-4 sm:px-10 lg:py-12">
          <div className="w-full max-w-[420px] animate-fade-in">{children}</div>
        </div>
      </main>
    </div>
  );
}

export function AuthHeading({ title, description }: { title: ReactNode; description?: ReactNode }) {
  return (
    <div className="mb-8">
      <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.02em]">{title}</h1>
      {description && <p className="mt-2 text-[14.5px] text-fg-muted">{description}</p>}
    </div>
  );
}
