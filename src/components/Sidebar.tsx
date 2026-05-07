"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    label: "Home",
    href: "/",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </svg>
    ),
  },
  {
    label: "Discover",
    href: "/discover",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 10.9c-.61 0-1.1.49-1.1 1.1s.49 1.1 1.1 1.1c.61 0 1.1-.49 1.1-1.1s-.49-1.1-1.1-1.1zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm2.19 12.19L6 18l3.81-8.19L18 6l-3.81 8.19z" />
      </svg>
    ),
  },
  {
    label: "Search",
    href: "/search",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
      </svg>
    ),
  },
  {
    label: "Trending",
    href: "/trending",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" />
      </svg>
    ),
  },
  {
    label: "Genres",
    href: "/browse",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z" />
      </svg>
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-surface p-2 rounded-lg"
        aria-label="Open menu"
      >
        <svg className="w-6 h-6 text-foreground" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-60 bg-surface border-r border-border z-40 flex flex-col",
          "lg:translate-x-0 transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo — claw-mark SVG: three diagonal slashes, electric cyan */}
        <div className="p-6 pb-4">
          <Link
            href="/"
            className="flex items-center gap-2 group"
            onClick={() => setMobileOpen(false)}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 22 22"
              fill="none"
              className="flex-shrink-0 transition-transform duration-300 group-hover:rotate-[8deg] group-hover:scale-110"
              style={{ filter: "drop-shadow(0 0 5px rgba(6, 182, 212, 0.55))" }}
              aria-hidden="true"
            >
              <path
                d="M3 4 L8 18"
                stroke="#06b6d4"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M8 2 L14 19"
                stroke="#06b6d4"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M14 5 L19 17"
                stroke="#06b6d4"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-lg font-display font-bold tracking-tight text-foreground transition-colors">
              SoundClaw
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-accent/10 text-accent"
                        : "text-muted hover:text-foreground hover:bg-elevated"
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          {/* Live agents indicator — telemetry voice */}
          <div className="flex items-center gap-2 mb-4 font-mono text-[10px] uppercase tracking-widest text-cyan">
            <span
              className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse-glow"
              style={{ boxShadow: "0 0 4px rgba(6, 182, 212, 0.7)" }}
              aria-hidden="true"
            />
            <span>0 agents live</span>
          </div>
          <Link
            href="/about"
            onClick={() => setMobileOpen(false)}
            className="text-xs text-muted hover:text-foreground transition-colors"
          >
            About SoundClaw
          </Link>
          <p className="text-[10px] text-muted/50 mt-1">Every artist is an AI</p>
        </div>
      </aside>
    </>
  );
}
