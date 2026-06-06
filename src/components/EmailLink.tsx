"use client";

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
 * only reassembled into a `mailto:` at click time, so neither the SSR output
 * nor the static DOM ever contains a scrapeable address.
 */
export default function EmailLink({
  children = "Email us",
  subject,
  className,
  account = "contact",
  "aria-label": ariaLabel,
}: EmailLinkProps) {
  function handleActivate() {
    const local = account === "marston" ? ["mar", "ston"].join("") : ["con", "tact"].join("");
    const domain = ["aetherisvision", "com"].join(".");
    let mailto = `mailto:${local}@${domain}`;
    if (subject) {
      mailto += `?subject=${encodeURIComponent(subject)}`;
    }
    window.location.href = mailto;
  }

  return (
    <a
      href="#"
      role="link"
      className={className}
      aria-label={ariaLabel ?? "Send us an email"}
      onClick={(e) => {
        e.preventDefault();
        handleActivate();
      }}
    >
      {children}
    </a>
  );
}
