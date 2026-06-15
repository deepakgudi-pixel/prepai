"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  CalendarDays,
  Pill,
  Scale,
  UserRound,
  Utensils,
} from "lucide-react";

const HEALTH_NAV_ITEMS = [
  { href: "/fitness-profile", label: "Profile", icon: UserRound },
  { href: "/nutrition", label: "Nutrition", icon: Utensils },
  { href: "/meal-planner", label: "Meal Plan", icon: CalendarDays },
  { href: "/body-tracking", label: "Body", icon: Scale },
  { href: "/supplements", label: "Supplements", icon: Pill },
  { href: "/progress", label: "Progress", icon: Activity },
];

export default function HealthNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Health navigation"
      className="glass-card p-2"
    >
      <div className="flex snap-x gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {HEALTH_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-w-fit snap-start items-center gap-2 rounded-full px-3 py-3 text-xs font-semibold uppercase transition-colors sm:px-4 ${
                isActive
                  ? "bg-[#222] text-[#EAE8E3]"
                  : "text-[#555] hover:bg-white/60 hover:text-[#111]"
              }`}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
