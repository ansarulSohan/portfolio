"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BriefcaseIcon,
  FolderGit2Icon,
  GraduationCapIcon,
  LayoutDashboardIcon,
  MailIcon,
  SettingsIcon,
  SparklesIcon,
  UserIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboardIcon,
    exact: true,
  },
  { href: "/admin/profile", label: "Profile", icon: UserIcon },
  { href: "/admin/projects", label: "Projects", icon: FolderGit2Icon },
  { href: "/admin/experience", label: "Experience", icon: BriefcaseIcon },
  { href: "/admin/education", label: "Education", icon: GraduationCapIcon },
  { href: "/admin/skills", label: "Skills", icon: SparklesIcon },
  { href: "/admin/messages", label: "Messages", icon: MailIcon },
  { href: "/admin/settings", label: "Settings", icon: SettingsIcon },
];

/** Sidebar on wide screens, a horizontally scrolling tab row on narrow ones. */
export function AdminNav({ unread }: { unread: number }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin sections">
      <ul className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-2 md:mx-0 md:flex-col md:overflow-visible md:px-0 md:pb-0">
        {ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {label}
                {href === "/admin/messages" && unread > 0 && (
                  <span
                    className={cn(
                      "ml-auto rounded-full px-1.5 text-xs tabular-nums",
                      active
                        ? "bg-primary-foreground/20"
                        : "bg-primary text-primary-foreground",
                    )}
                  >
                    {unread}
                    <span className="sr-only"> unread</span>
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
