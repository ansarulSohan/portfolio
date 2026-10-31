import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRightIcon,
  BriefcaseIcon,
  FolderGit2Icon,
  GraduationCapIcon,
  MailIcon,
  SparklesIcon,
  UserIcon,
} from "lucide-react";
import { getAdminProfile, getDashboardStats } from "@/lib/admin-queries";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const [stats, profile] = await Promise.all([
    getDashboardStats(),
    getAdminProfile(),
  ]);

  const cards = [
    {
      href: "/admin/messages",
      icon: MailIcon,
      label: "Messages",
      value:
        stats.unread > 0 ? `${stats.unread} unread` : `${stats.messages} total`,
      highlight: stats.unread > 0,
    },
    {
      href: "/admin/projects",
      icon: FolderGit2Icon,
      label: "Projects",
      value: `${stats.published} published of ${stats.projects}`,
    },
    {
      href: "/admin/experience",
      icon: BriefcaseIcon,
      label: "Experience",
      value: `${stats.experience} roles`,
    },
    {
      href: "/admin/education",
      icon: GraduationCapIcon,
      label: "Education",
      value: `${stats.education} entries`,
    },
    {
      href: "/admin/skills",
      icon: SparklesIcon,
      label: "Skills",
      value: `${stats.skills} groups`,
    },
    {
      href: "/admin/profile",
      icon: UserIcon,
      label: "Profile",
      value: profile?.name ?? "Not set up",
    },
  ];

  // Gentle prompts for things that make the site look unfinished.
  const todos = [
    !profile?.tagline && {
      href: "/admin/profile",
      text: "Add a tagline under your title",
    },
    stats.published === 0 && {
      href: "/admin/projects",
      text: "Publish at least one project",
    },
    !profile?.avatar && {
      href: "/admin/profile",
      text: "Add a profile photo",
    },
  ].filter((todo): todo is { href: string; text: string } => Boolean(todo));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Everything on your site, in one place.
        </p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ href, icon: Icon, label, value, highlight }) => (
          <li key={href}>
            <Link
              href={href}
              className={`bg-card hover:border-primary/50 flex items-center gap-4 rounded-xl border p-4 transition-colors ${highlight ? "border-primary/60" : ""}`}
            >
              <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block font-medium">{label}</span>
                <span className="text-muted-foreground block truncate text-sm">
                  {value}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {todos.length > 0 && (
        <section
          aria-labelledby="todo-heading"
          className="bg-card rounded-xl border p-5"
        >
          <h2 id="todo-heading" className="font-semibold">
            Suggestions
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {todos.map((todo) => (
              <li key={todo.text}>
                <Link
                  href={todo.href}
                  className="text-primary inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
                >
                  {todo.text}
                  <ArrowRightIcon className="size-3.5" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
