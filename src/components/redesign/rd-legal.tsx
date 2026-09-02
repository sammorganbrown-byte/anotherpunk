import type { ReactNode } from "react";
import { RdPixelText } from "./rd-pixel-text";

/** Shared frame for the policy pages.
 *
 * Deliberately plainer than the rest of the site. Everywhere else the writing
 * is clipped and fragmented, which suits a shop; it does not suit the page
 * someone reads when they want their money back. These pages are written in
 * whole sentences and say what actually happens, because a policy that has to
 * be decoded is worse than no policy — and in the EU several of these
 * statements are things a buyer has a legal right to be told plainly.
 */
export function RdLegal({
  label,
  title,
  updated,
  children,
}: {
  label: string;
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="rd-legal">
      <p className="rd-label mb-4">
        {label} <span className="rd-key">/</span> {updated}
      </p>
      <RdPixelText as="h1" text={title} />
      <div className="rd-legal-body">{children}</div>
    </div>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section>
      <h2>{heading}</h2>
      {children}
    </section>
  );
}
