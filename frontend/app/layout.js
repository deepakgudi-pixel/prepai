import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";
import Header from "@/components/extras/header";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/themes";
import { Toaster } from "@/components/ui/sonner";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["400", "500", "600", "700"],
});

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
          card: "rounded-[28px] bg-[rgba(255,249,241,1)] shadow-[0_24px_80px_rgba(48,37,24,0.16)] border border-stone-900/8",
          modalContent:
            "rounded-[28px] bg-[rgba(255,249,241,1)] shadow-[0_24px_80px_rgba(48,37,24,0.16)] border border-stone-900/8",
          popoverCard:
            "rounded-[24px] bg-[rgba(255,249,241,1)] shadow-[0_24px_80px_rgba(48,37,24,0.16)] border border-stone-900/8",
          userButtonPopoverCard:
            "rounded-[24px] bg-[rgba(255,249,241,1)] shadow-[0_24px_80px_rgba(48,37,24,0.16)] border border-stone-900/8",
          socialButtonsBlockButton: "rounded-full bg-white opacity-100",
          formFieldInput: "rounded-full bg-white opacity-100",
          formFieldLabel: "opacity-100",
          formButtonPrimary: "rounded-full opacity-100",
          footerActionLink: "opacity-100",
          identityPreview: "rounded-[20px] opacity-100",
          userButtonPopoverActionButton: "rounded-[18px]",
          userButtonPopoverActionButtonText: "opacity-100",
          userButtonPopoverFooter: "opacity-100",
          navbar: "bg-[rgba(255,249,241,1)]",
          pageScrollBox: "bg-transparent",
        },
      }}
    >
      <html lang="en">
        <body className={`${manrope.variable} ${cormorant.variable} app-shell`}>
          <Header />
          <main className="min-h-screen pt-24">{children}</main>
          <Toaster richColors />
          <footer className="px-4 pb-8 pt-4 sm:px-6 lg:px-8">
            <div className="page-frame">
              <div className="section-shell flex flex-col gap-6 px-6 py-8 sm:flex-row sm:items-end sm:justify-between sm:px-8">
                <div className="max-w-xl">
                  <p className="eyebrow mb-4">PrepAI Kitchen Notes</p>
                  <h2 className="font-display text-3xl text-stone-950 sm:text-4xl">
                    Built for kitchens that want less waste and better dinners.
                  </h2>
                </div>
                <div className="space-y-2 text-sm text-stone-600">
                  <p>Curated recipes, pantry intelligence, and faster weeknight decisions.</p>
                  <p>© {new Date().getFullYear()} PrepAI</p>
                </div>
              </div>
            </div>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
