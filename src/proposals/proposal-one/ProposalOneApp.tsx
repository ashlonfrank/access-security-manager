import assets from "../../assets.json";
import { coffeeCompanies } from "../../business";
import type { User } from "../../App";

export type ProposalOneUser = User;

function Icon({ src, inverse = false }: { src: string; inverse?: boolean }) {
  return inverse ? (
    <span
      className="masked-icon"
      style={{ maskImage: `url(${src})` }}
      aria-hidden="true"
    />
  ) : (
    <img src={src} alt="" />
  );
}

/** Placeholder shell for Figma Option 1 — layout experiments live here. */
export default function ProposalOneApp() {
  const orgLabel = coffeeCompanies[0]?.name ?? "Bean & Branch";

  return (
    <>
      <a className="skip-link" href="#proposal-main">
        Skip to proposal workspace
      </a>
      <header>
        <div className="brand-bar">
          <div className="brand-left">
            <button className="icon-button" aria-label="Open navigation menu" type="button">
              <Icon src={assets.imgFill} inverse />
            </button>
            <img
              className="brand-logo"
              src={assets.imgGroup}
              alt="Chase for Business"
            />
          </div>
          <div className="brand-actions">
            <button className="icon-button" aria-label="Help" type="button">
              <Icon src={assets.imgFill2} inverse />
            </button>
            <button className="sign-out" type="button">
              Sign out
            </button>
          </div>
        </div>
        <nav className="primary-nav" aria-label="Business banking">
          <button type="button" aria-current="page">
            Access &amp; security
          </button>
        </nav>
      </header>
      <div className="back-bar">
        <button
          type="button"
          onClick={() => {
            window.location.assign(window.location.pathname);
          }}
        >
          <Icon src={assets.imgFill5} />
          Baseline app
        </button>
        <div>Access &amp; Security Manager</div>
      </div>
      <main id="proposal-main">
        <div className="management-heading">
          <div className="heading-tabs">
            <h1>Proposal 1</h1>
            <p className="proposal-one-lede">
              Figma Option 1 workspace for {orgLabel}. Shared domain types and
              design tokens only — side-panel UX stays on the baseline until
              this shell is ready.
            </p>
          </div>
        </div>
        <section className="proposal-one-panel" aria-labelledby="proposal-one-heading">
          <h2 id="proposal-one-heading">Next steps</h2>
          <p>
            Build layout and navigation here on branch{" "}
            <code>proposal-1</code>. Preview with{" "}
            <code>?prototype=proposal-one</code> (or hash{" "}
            <code>#prototype=proposal-one</code>).
          </p>
        </section>
      </main>
    </>
  );
}
