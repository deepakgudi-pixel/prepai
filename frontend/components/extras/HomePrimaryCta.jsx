"use client";

import { SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePrimaryCta() {
  return (
    <>
      <SignedIn>
        <Link href="/pantry">
          <Button size="xl" variant="primary" className="w-full sm:w-auto">
            Go to pantry
            <ArrowRight className="size-5" />
          </Button>
        </Link>
      </SignedIn>

      <SignedOut>
        <SignUpButton mode="modal">
          <Button size="xl" variant="primary" className="w-full sm:w-auto">
            Go to pantry
            <ArrowRight className="size-5" />
          </Button>
        </SignUpButton>
      </SignedOut>
    </>
  );
}
