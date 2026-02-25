import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { Button } from "../ui/button";
import Link from "next/link";
import Image from "next/image";
import { Cookie, Refrigerator } from "lucide-react";
import UserDropdown from "./UserDropdown";
import { checkUser } from "@/lib/checkUser";

async function Header() {
  const user = await checkUser();

  return (
    <header
      className={
        "fixed top-0 w-full border-b border-stone-200 bg-stone-50/80 backdrop-blur-md z-50 supports-backdrop-filter:bg-stone-50/60"
      }
    >
      {/* Show the sign-in and sign-up buttons when the user is signed out */}
      <nav
        className={
          "container mx-auto px-4 h-16 flex items-center justify-between"
        }
      >
        <Link href={user ? "/dashboard" : "/"}>
          <Image
            src={"/prep-ai-logo.png"}
            alt={"prepAI Logo"}
            width={60}
            height={60}
            className={"w-16"}
          />
        </Link>

        {/* Navigation Links */}
        <div className={"hidden md:flex items-center space-x-8 text-sm font-medium text-stone-600"}>
          <Link
            href={"/recipes"}
            className={"hover:text-green-800 transition-colors flex gap-1.5 items-center"}
          >
            <Cookie className={"w-4 h-4"} />
            My Recipes
          </Link>
          <Link
            href={"/pantry"}
            className={"hover:text-green-800 transition-colors flex gap-1.5 items-center"}
          >
            <Refrigerator className={"w-4 h-4"} />
            My Pantry
          </Link>
        </div>

        {/* {signIn / singUp} */}
        <div className={"flex items-center space-x-4"}>
          {/* Show the user button when the user is signed in */}
          <SignedIn>
            <UserDropdown />
          </SignedIn>

          <SignedOut>
            <SignInButton mode={"modal"}>
              <Button
                className={
                  "bg-transparent hover:bg-transparent transition-colors text-stone-600 hover:text-green-800 font-medium "
                }
              >
                Sign In
              </Button>
            </SignInButton>
            <SignUpButton mode={"modal"}>
              <Button variant={"primary"} className={"rounded-md px-6"}>
                Get Started
              </Button>
            </SignUpButton>
          </SignedOut>
        </div>
      </nav>
    </header>
  );
}

export default Header;
