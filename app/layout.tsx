import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import { Network, Sparkles, Compass, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'ProofMesh — Autonomous AI Research Scientist',
  description:
    'Turn the live web into an explainable, auditable evidence graph. Autonomous research scientist with multi-agent verification and contradiction detection.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#080B12] text-[#F5F7FB] antialiased min-h-screen flex flex-col selection:bg-[#3678F6]/30 selection:text-[#F5F7FB]">
        {/* Workstation Top Navigation */}
        <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#080B12]/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3678F6] to-[#20B77A] p-[1px] flex items-center justify-center shadow-lg shadow-[#3678F6]/20">
                  <div className="w-full h-full bg-[#080B12] rounded-[7px] flex items-center justify-center">
                    <Network className="w-4 h-4 text-[#3678F6] group-hover:rotate-12 transition-transform duration-300" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold tracking-tight text-base text-[#F5F7FB]">
                    Proof<span className="text-[#3678F6]">Mesh</span>
                  </span>
                  <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-[#3678F6]/10 text-[#3678F6] border border-[#3678F6]/20">
                    Swarm v2.0
                  </span>
                </div>
              </Link>

              <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-[#8994A8]">
                <Link
                  href="/research"
                  className="px-3 py-1.5 rounded-md hover:text-[#F5F7FB] hover:bg-white/[0.04] transition-colors flex items-center gap-1.5"
                >
                  <Compass className="w-4 h-4" />
                  Workspace
                </Link>
                <Link
                  href="/research#history"
                  className="px-3 py-1.5 rounded-md hover:text-[#F5F7FB] hover:bg-white/[0.04] transition-colors"
                >
                  Investigations
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-xs text-[#8994A8] bg-[#101522] border border-white/[0.06] px-2.5 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-[#20B77A] animate-pulse"></span>
                <span>Swarm Engine Ready</span>
              </div>

              <Link
                href="/research"
                className="text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-[#3678F6] hover:bg-[#3678F6]/90 text-white transition-all shadow-sm shadow-[#3678F6]/30 flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                New Investigation
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col">{children}</main>

        {/* Workstation Footer */}
        <footer className="border-t border-white/[0.06] bg-[#080B12] py-8 text-xs text-[#8994A8]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#20B77A]" />
              <span>
                Zero-Fabrication Guarantee: Every finding is cryptographically mapped to verifiable web sources.
              </span>
            </div>
            <div className="flex items-center gap-4 text-[#5A6478]">
              <span>TinyFish Web Agent Engine</span>
              <span>•</span>
              <span>Gemini 2.5 Flash Swarm</span>
              <span>•</span>
              <span>ProofMesh Autonomous Scientist</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
