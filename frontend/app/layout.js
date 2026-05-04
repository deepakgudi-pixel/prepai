import "./globals.css";
import Header from "@/components/extras/header";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/themes";
import { Toaster } from "@/components/ui/sonner";
import SmoothScroll from "@/components/ui/SmoothScroll";
import CustomCursor from "@/components/ui/CustomCursor";
import { Inter, Playfair_Display } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-display" });

export const metadata = {
  title: "PrepAI",
  description: "Turn pantry ingredients into striking, chef-led meal ideas.",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: shadcn,
        elements: {
          card: "rounded-[8px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)] border border-stone-200",
          modalContent:
            "rounded-[8px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)] border border-stone-200",
          popoverCard:
            "rounded-[8px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)] border border-stone-200",
          userButtonPopoverCard:
            "rounded-[8px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)] border border-stone-200",
          socialButtonsBlockButton: "rounded-full bg-white opacity-100",
          formFieldInput: "rounded-full bg-white opacity-100",
          formFieldLabel: "opacity-100",
          formButtonPrimary: "rounded-full opacity-100",
          footerActionLink: "opacity-100",
          identityPreview: "rounded-[8px] opacity-100",
          userButtonPopoverActionButton: "rounded-[8px]",
          userButtonPopoverActionButtonText: "opacity-100",
          userButtonPopoverFooter: "opacity-100",
          navbar: "bg-white",
          pageScrollBox: "bg-transparent",
        },
      }}
    >
      <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
        <body className="app-shell bg-[#EAE8E3] text-[#222222] selection:bg-[#222222] selection:text-[#EAE8E3] cursor-none">
          <CustomCursor />
      <SmoothScroll>
            <Header />
            <main className="min-h-screen">{children}</main>
            <Toaster richColors />
            <footer className="mt-32 border-t border-[#D5D3CE] bg-[#EAE8E3]">
            <div className="page-frame flex flex-col gap-8 py-10 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="eyebrow">PrepAI</p>
                <h2 className="mt-4 font-display text-3xl leading-tight text-stone-950 sm:text-4xl">
                  Pantry-first planning for weeknights that need to move fast.
                </h2>
              </div>
              <div className="space-y-2 text-sm text-stone-500">
                <p>AI recipe generation, pantry intelligence, and cleaner cooking decisions.</p>
                <p>© 2026 PrepAI</p>
              </div>
            </div>
            </footer>
          </SmoothScroll>
        </body>
      </html>
    </ClerkProvider>
  );
}
