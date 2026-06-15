import "./globals.css";
import Header from "@/components/extras/header";
import AIChat from "@/components/extras/AIChat";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/themes";
import { Toaster } from "@/components/ui/sonner";
import SmoothScroll from "@/components/ui/SmoothScroll";

export const metadata = {
  title: "PrepAI",
  description: "AI meal planning, pantry recipes, grocery lists, and fitness tracking.",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: shadcn,
        elements: {
          card: "rounded-[8px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)] border border-stone-200",
          modalContent: "rounded-[16px] bg-[#EAE8E3] backdrop-blur-lg border border-stone-300 shadow-[0_24px_80px_rgba(15,23,42,0.08)]",
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
          footer: "hidden",
        },
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body className="app-shell bg-[#EAE8E3] text-[#222222] selection:bg-[#222222] selection:text-[#EAE8E3]" suppressHydrationWarning>
          <SmoothScroll>
            <Header />
            <main className="min-h-screen">{children}</main>
            <AIChat />
            <Toaster />
          </SmoothScroll>
        </body>
      </html>
    </ClerkProvider>
  );
}
