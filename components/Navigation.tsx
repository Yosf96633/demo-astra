"use client";
import { useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
export function Brand() {
  return (
    <a className="brand" href="#home" aria-label="Event Horizon home">
      <span className="brand-mark" aria-hidden="true" />
      <span>
        EVENT HORIZON
        <span className="brand-caption">CURIOSITY HAS NO LIMITS</span>
      </span>
    </a>
  );
}
export default function Navigation() {
  const [open, setOpen] = useState(false);
  return (
    <header className="navigation page-width">
      <Brand />
      <nav className="desktop-nav" aria-label="Main navigation">
        <a href="#concept">The concept</a>
        <a href="#discover">Discover</a>
        <a href="#nebula">Nebula</a>
        <a href="#milky-way">Milky Way</a>
        <a href="#neutron-star">Neutron star</a>
        <a href="#transmission">
          Stay in orbit <ArrowUpRight size={13} />
        </a>
      </nav>
      <a className="nav-cta" href="#concept">
        Enter the unknown <ArrowUpRight size={15} />
      </a>
      <button
        className="mobile-menu-button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen(!open)}
      >
        {open ? <X /> : <Menu />}
      </button>
      {open && (
        <nav
          id="mobile-nav"
          className="mobile-nav"
          aria-label="Mobile navigation"
        >
          {[
            ["The concept", "concept"],
            ["Discover", "discover"],
            ["Nebula", "nebula"],
            ["Milky Way", "milky-way"],
            ["Neutron star", "neutron-star"],
            ["Stay in orbit", "transmission"],
          ].map(([title, id]) => (
            <a key={id} href={`#${id}`} onClick={() => setOpen(false)}>
              {title}
              <ArrowUpRight size={16} />
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
