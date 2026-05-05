"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/cases", label: "Cases", icon: "📁" },
];

export function Sidebar(): React.ReactElement {
  const pathname = usePathname();

  return (
    <nav
      className="w-56 shrink-0 border-r border-card-border bg-surface-editor"
      data-testid="sidebar"
    >
      <ul className="flex flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "border-l-2 border-primary bg-[#0F2E1F] text-primary"
                    : "text-text-secondary hover:bg-card hover:text-text-primary"
                }`}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
