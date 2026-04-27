import "./globals.css";
import Header from "@/components/extras/header";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/themes";
import { Toaster } from "@/components/ui/sonner";

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
      <html lang="en">
        <body className="app-shell">
          <Header />
          <main className="min-h-screen pt-20">{children}</main>
          <Toaster richColors />
          <footer className="mt-20 border-t border-stone-200 bg-white">
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
        </body>
      </html>
    </ClerkProvider>
  );
}
