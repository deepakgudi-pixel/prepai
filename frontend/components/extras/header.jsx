"use client";

import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
} from "@clerk/nextjs";
import { Soup } from "lucide-react";
import Link from "next/link";
import UserDropdown from "./UserDropdown";
import { Button } from "../ui/button";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/recipes", label: "Saved" },
  { href: "/pantry", label: "Pantry" },
];

function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-stone-200 bg-[rgba(250,250,248,0.94)] backdrop-blur-xl">
      <div className="page-frame grid h-20 grid-cols-[1fr_auto_1fr] items-center gap-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-full bg-stone-950 text-white">
            <Soup className="size-5" />
          </span>
          <div>
            <p className="font-display text-xl text-stone-950">PrepAI</p>
            <p className="text-[0.68rem] uppercase tracking-[0.2em] text-stone-500">
              Kitchen OS
            </p>
          </div>
        </Link>

        <SignedIn>
          <nav className="hidden items-center gap-7 md:flex">
            {navItems.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm font-medium text-stone-600 hover:text-stone-950"
              >
                {label}
              </Link>
            ))}
          </nav>
        </SignedIn>

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
                Get Started
              </Button>
            </SignUpButton>
          </SignedOut>
        </div>
      </div>
    </header>
  );
}

export default Header;
