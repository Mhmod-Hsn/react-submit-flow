import Link from "next/link";
import type { Metadata } from "next";
import { LiveDemo } from "../components/live-demo";

export const metadata: Metadata = {
  title: "Typed async actions for React",
  description:
    "Typed React action flows with accessible feedback and zero additional runtime dependencies.",
};

const code = `const flow = useSubmitFlow({
  save: {
    run: async (values) => saveProfile(values),
    pendingLabel: 'Saving…',
    success: 'Profile saved.',
  },
})`;

export default function HomePage() {
  return (
    <>
      <section className="hero site-container">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="eyebrow-line" /> A calmer way to submit
          </div>
          <h1>
            Async actions,
            <br />
            <span>handled.</span>
          </h1>
          <p className="hero-subtitle">
            One typed flow for pending states, confirmations, success, errors, and cancellation.
            Bring your form library. Keep your UI.
          </p>
          <div className="hero-actions">
            <Link className="button button-dark" href="/docs/getting-started">
              Get started <span aria-hidden="true">→</span>
            </Link>
            <Link className="button button-light" href="/examples">
              Explore examples
            </Link>
          </div>
          <div className="hero-note">
            <span>◈</span> Zero additional runtime dependencies. React is the peer.
          </div>
        </div>
        <div className="hero-demo">
          <LiveDemo />
        </div>
      </section>
      <section className="code-strip site-container">
        <div>
          <span className="section-kicker">A small API</span>
          <h2>Keep the work. Lose the busywork.</h2>
          <p>
            Write the action once. Your components get useful state and thoughtful feedback
            automatically.
          </p>
        </div>
        <pre>
          <code>{code}</code>
        </pre>
      </section>
      <section className="feature-section">
        <div className="site-container">
          <span className="section-kicker">Made for real apps</span>
          <h2>Plays well with your stack.</h2>
          <div className="feature-grid">
            <article>
              <span className="feature-icon">↗</span>
              <h3>More than one button</h3>
              <p>
                Save, publish, delete, cancel, and back actions can share a form while keeping
                behavior clear.
              </p>
            </article>
            <article>
              <span className="feature-icon">◎</span>
              <h3>Dialogs that know the flow</h3>
              <p>
                Confirm a change, keep the dialog open while it saves, then show success or a clear
                error.
              </p>
            </article>
            <article>
              <span className="feature-icon">⌘</span>
              <h3>Works with what you use</h3>
              <p>
                Bring native forms, React Hook Form, your API client, and your existing visual
                system.
              </p>
            </article>
            <article>
              <span className="feature-icon">0</span>
              <h3>No added runtime dependencies</h3>
              <p>
                React is the required peer. No extra dialog, toast, or form-state package is pulled
                into your app.
              </p>
              <Link className="text-link" href="/docs/dependencies-and-bundle-footprint">
                See the dependency details →
              </Link>
            </article>
          </div>
        </div>
      </section>
      <section className="cta-section site-container">
        <div>
          <span className="section-kicker">Start with one action</span>
          <h2>Your next submit can feel effortless.</h2>
        </div>
        <Link className="button button-dark" href="/docs/getting-started">
          Read the quick start →
        </Link>
      </section>
    </>
  );
}
