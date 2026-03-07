const footerLinks = {
  Product: ["Features", "Pricing", "Download", "Changelog", "Status"],
  Company: ["About", "Blog", "Careers", "Press Kit"],
  Legal: ["Privacy Policy", "Terms of Service", "Cookie Policy", "GDPR"],
};

const Footer = () => (
  <footer className="border-t border-border bg-card py-16">
    <div className="container">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          <p className="text-lg font-bold tracking-tight mb-2">
            Focus<span className="text-primary">Flow</span>
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Do less. Achieve more.
          </p>
          <div className="flex gap-4">
            {["Twitter/X", "LinkedIn", "GitHub"].map((s) => (
              <a
                key={s}
                href="#"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {s}
              </a>
            ))}
          </div>
        </div>

        {/* Link columns */}
        {Object.entries(footerLinks).map(([title, links]) => (
          <div key={title}>
            <p className="text-sm font-semibold mb-3">{title}</p>
            <ul className="space-y-2">
              {links.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>© 2026 FocusFlow, Inc.</span>
        <span>Made with ☕ in San Francisco</span>
      </div>
    </div>
  </footer>
);

export default Footer;
