"use client";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
import { ArrowUp, ArrowUpRight, Check, X } from "lucide-react";
import { Brand } from "./Navigation";
import Reveal from "./Reveal";

function subscribeToManifest(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("manifest-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("manifest-change", callback);
  };
}
function manifestSnapshot() {
  try {
    return localStorage.getItem("event-horizon-joined") === "true";
  } catch {
    return false;
  }
}
export default function CTA() {
  const saved = useSyncExternalStore(
    subscribeToManifest,
    manifestSnapshot,
    () => false,
  );
  const [sessionJoined, setSessionJoined] = useState(false);
  const joined = saved || sessionJoined;
  const [privacy, setPrivacy] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (privacy) dialog.current?.showModal();
    else dialog.current?.close();
  }, [privacy]);
  function subscribe(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Concept-only signup: retain a preference, never persist or transmit email.
    try {
      localStorage.setItem("event-horizon-joined", "true");
    } catch {
      /* The confirmation still works without storage. */
    }
    setSessionJoined(true);
    window.dispatchEvent(new Event("manifest-change"));
  }
  return (
    <section id="transmission" className="cta-section">
      <div className="cta-orbits" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <Reveal className="cta-content relative z-10 mx-auto text-center">
        <div className="eyebrow section-label justify-center">
          <span className="status-light" /> 05 / THE NEXT FRONTIER
        </div>
        <h2>
          The universe is calling.
          <br />
          <span>Stay in orbit.</span>
        </h2>
        <p>
          For the curious minds who never stop looking up.
          <br />
          Be part of what comes next.
        </p>
        <div className="signup-container" aria-live="polite">
          {joined ? (
            <div className="signup-success">
              <span>
                <Check size={19} /> You’re on the flight manifest.
              </span>
              <p>
                Your place in this concept expedition is saved on this device.
              </p>
              <button
                onClick={() => {
                  setSessionJoined(false);
                  try {
                    localStorage.removeItem("event-horizon-joined");
                  } catch {
                    /* Storage is optional. */
                  }
                  window.dispatchEvent(new Event("manifest-change"));
                }}
              >
                Leave the manifest
              </button>
            </div>
          ) : (
            <form onSubmit={subscribe} className="signup-form">
              <label htmlFor="email" className="sr-only">
                Your email address
              </label>
              <input
                required
                type="email"
                id="email"
                name="email"
                autoComplete="email"
                placeholder="Your email address"
                maxLength={254}
              />
              <button className="button-primary" type="submit">
                Join the expedition <ArrowUpRight size={17} />
              </button>
            </form>
          )}
        </div>
        <span className="signup-note">
          A FICTIONAL EXPEDITION. REAL CURIOSITY.{" "}
          <button onClick={() => setPrivacy(true)}>
            DEMO SIGNUP <ArrowUpRight size={10} />
          </button>
        </span>
      </Reveal>
      <footer className="footer page-width">
        <div className="footer-main">
          <Brand />
          <p>For everything we have yet to discover.</p>
          <a href="#home" className="back-top" aria-label="Back to top">
            <ArrowUp size={18} />
          </a>
        </div>
        <div className="footer-bottom">
          <span>© 2026 EVENT HORIZON</span>
          <div>
            <a href="#concept">Our perspective</a>
            <button onClick={() => setPrivacy(true)}>Privacy</button>
            <span className="footer-location">
              <span className="status-light" /> MADE ON EARTH. LOOKING BEYOND.
            </span>
          </div>
        </div>
      </footer>
      <dialog
        ref={dialog}
        className="privacy-dialog"
        onCancel={() => setPrivacy(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setPrivacy(false);
        }}
      >
        <div>
          <button
            className="dialog-close"
            aria-label="Close privacy information"
            onClick={() => setPrivacy(false)}
          >
            <X size={20} />
          </button>
          <span className="eyebrow">MISSION TRANSPARENCY</span>
          <h3>A little space for privacy.</h3>
          <p>
            Event Horizon is a fictional space exploration brand. This
            demonstration does not send or store your email address, subscribe
            you to a mailing list, or contact an external service.
          </p>
          <p>
            Joining saves only a confirmation on this device. Use “Leave the
            manifest” to clear it. No tracking or analytics are used.
          </p>
          <button className="button-primary" onClick={() => setPrivacy(false)}>
            Understood <Check size={16} />
          </button>
        </div>
      </dialog>
    </section>
  );
}
