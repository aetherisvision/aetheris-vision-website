"use client";

import { useEffect, useState } from "react";

type EmailLinkProps = {
  children?: React.ReactNode;
  subject?: string;
  className?: string;
  account?: "contact" | "marston";
  "aria-label"?: string;
};

/**
 * Renders an email contact link without exposing the raw address as plaintext
 * in the server-rendered HTML. The address is stored in obfuscated parts and
 * only reassembled into a `mailto:` href after the component mounts on the
 * client, so SSR output contains no scrapeable address.
 */
export default function EmailLink({
  children = "Email us",
  subject,
  className,
  account = "contact",
  "aria-label": ariaLabel,
}: EmailLinkProps) {
  const [href, setHref] = useState<string | undefined>(undefined);

  useEffect(() => {
    const local = account === "marston" ? ["mar", "ston"].join("") : ["con", "tact"].join("");
    const domain = ["aetherisvision", "com"].join(".");
    const address = `${local}@${domain}`;

    let mailto = `mailto:${address}`;
    if (subject) {
      mailto += `?subject=${encodeURIComponent(subject)}`;
    }

    setHref(mailto);
  }, [subject, account]);

  // Before mount (and in SSR output), render the label with no href and no
  // address, so there is no plaintext email and no layout shift on hydration.
  if (!href) {
    return (
      <span role="link" aria-disabled="true" className={className}>
        {children}
      </span>
    );
  }

  return (
    <a href={href} className={className} aria-label={ariaLabel ?? "Send us an email"}>
      {children}
    </a>
  );
}
