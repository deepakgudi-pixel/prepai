import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
} from "@clerk/nextjs";
import { Sparkles, Soup, BookHeart, Package2 } from "lucide-react";
import Link from "next/link";
import UserDropdown from "./UserDropdown";
import { Button } from "../ui/button";

const navItems = [
  { href: "/", label: "Home", icon: Sparkles },
  { href: "/recipes", label: "Saved", icon: BookHeart },
  { href: "/pantry", label: "Pantry", icon: Package2 },
];

async function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <nav className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-white/60 bg-[rgba(255,249,241,0.82)] px-4 py-3 shadow-[0_12px_40px_rgba(48,37,24,0.08)] backdrop-blur-xl sm:px-6 lg:px-8">
          <Link
            href="/"
            className="group flex items-center gap-3"
          >
            <span className="flex size-11 items-center justify-center rounded-full bg-stone-950 text-stone-50 shadow-[0_14px_30px_rgba(24,22,18,0.25)]">
              <Soup className="size-5" />
            </span>
            <div>
              <p className="font-display text-2xl leading-none text-stone-950">
                PrepAI
              </p>
              <p className="text-[0.68rem] uppercase tracking-[0.22em] text-stone-500">
                Intelligent kitchen studio
              </p>
            </div>
          </Link>

          <div className="hidden items-center justify-center gap-2 md:flex">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="nav-pill flex items-center gap-2 hover:-translate-y-0.5 hover:border-emerald-900/20 hover:text-emerald-900">
                <Icon className="size-4" />
                <span>{label}</span>
              </Link>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3">
            <SignedIn>
              <UserDropdown />
            </SignedIn>

            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="ghost" className="rounded-full px-5 text-stone-700">
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button variant="primary" className="rounded-full px-5">
                  Start Free
                </Button>
              </SignUpButton>
            </SignedOut>
          </div>
        </nav>
    </header>
  );
}

export default Header;
