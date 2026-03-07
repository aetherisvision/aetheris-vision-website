const footerLinks = [
  { label: "Expertise", href: "/#expertise" },
  { label: "About", href: "/about" },
  { label: "Capabilities", href: "/capabilities" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Blog", href: "/blog" },
  { label: "Book a Call", href: "/book" },
  { label: "Contact", href: "/contact" },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-black">
      <div className="mx-auto max-w-5xl px-6 py-12">
        {/* Top row: logo + nav */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3 shrink-0">
            <img
              src="/logo/aetheris-logo.svg"
              alt="Aetheris Vision Logo"
              className="h-8 w-8"
            />
            <div className="text-lg font-bold tracking-tight text-white">
              <span className="font-light text-gray-500">Aetheris</span>Vision
            </div>
          </a>

          {/* Nav links */}
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {footerLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-gray-500 hover:text-gray-300 transition"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-white/5 mb-8" />

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs text-gray-600">
          <span>&copy; {new Date().getFullYear()} Aetheris Vision LLC. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <span>Veteran-Owned Small Business (VOSB)</span>
            <span className="text-white/10">·</span>
            <a
              href="mailto:contact@aetherisvision.com"
              className="hover:text-gray-400 transition"
            >
              contact@aetherisvision.com
            </a>
            <span className="text-white/10">·</span>
            <a href="/privacy" className="hover:text-gray-400 transition">
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
