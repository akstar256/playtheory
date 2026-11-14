import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PlayTheory — Concept to Interactive Simulation",
  description: "Type any concept. PlayTheory builds a working, verified interactive simulation with live sliders, plots, guided predict-then-reveal tours, and quizzes.",
  openGraph: {
    title: "PlayTheory — Concept to Interactive Simulation",
    description: "Compound AI system turning complex ideas into playable, sandboxed simulations.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Modern Web Guidance: Speculation Rules API for instant prefetch and prerender on hover */}
        <script
          type="speculationrules"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              prefetch: [
                {
                  source: "document",
                  where: {
                    and: [
                      { href_matches: "/*" },
                      { not: { href_matches: "/api/*" } }
                    ]
                  },
                  eagerness: "moderate"
                }
              ],
              prerender: [
                {
                  source: "document",
                  where: {
                    or: [
                      { href_matches: "/s/*" },
                      { href_matches: "/status" },
                      { href_matches: "/about" }
                    ]
                  },
                  eagerness: "conservative"
                }
              ]
            })
          }}
        />
      </head>
      <body className="antialiased selection:bg-arcade-cyan selection:text-paper-950">
        {children}
      </body>
    </html>
  );
}
