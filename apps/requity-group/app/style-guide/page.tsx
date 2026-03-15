import type { Metadata } from "next";
import Link from "next/link";
import SectionLabel from "../components/SectionLabel";
import ScrollReveal from "../components/ScrollReveal";
import AnimatedLine from "../components/AnimatedLine";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Style Guide",
  description: "Requity Group design system and component reference.",
  robots: { index: false, follow: false },
};

export default function StyleGuidePage() {
  return (
    <main>
      {/* Hero */}
      <section
        className="dark-zone hero-gradient"
        style={{
          paddingTop: "clamp(160px, 20vw, 240px)",
          paddingBottom: "clamp(80px, 10vw, 120px)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div className="navy-grid-pattern">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="navy-grid-line" style={{ left: `${(i + 1) * 7.14}%` }} />
          ))}
        </div>
        <div className="navy-glow" style={{ top: "10%", right: "15%" }} />
        <div className="navy-bottom-fade" />
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <SectionLabel light>Design System</SectionLabel>
          <h1 className="type-hero" style={{ color: "#fff", maxWidth: 700 }}>
            Requity Group <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>Style Guide</em>
          </h1>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 17,
              lineHeight: 1.75,
              color: "var(--navy-text-mid)",
              maxWidth: 560,
              marginTop: 28,
            }}
          >
            Use this page as the single source of truth for colors, type, components, and layout when expanding the site.
          </p>
          <Link href="/" className="btn-editorial-light" style={{ marginTop: 32, display: "inline-flex" }}>
            Back to Home <span className="arrow">&rarr;</span>
          </Link>
        </div>
      </section>

      {/* Colors */}
      <section className="light-zone section-pad-lg">
        <div className="container">
          <ScrollReveal>
            <SectionLabel>Colors</SectionLabel>
            <h2 className="type-h2" style={{ color: "var(--text)", marginBottom: 48 }}>
              Palette
            </h2>
          </ScrollReveal>

          <ScrollReveal>
            <p className="type-body-sm" style={{ color: "var(--text-mid)", marginBottom: 24 }}>
              Core palette. Use CSS variables: <code style={{ background: "var(--cream-dark)", padding: "2px 6px", borderRadius: 4 }}>var(--navy)</code>, <code style={{ background: "var(--cream-dark)", padding: "2px 6px", borderRadius: 4 }}>var(--gold)</code>, etc.
            </p>
            <div className="grid-4" style={{ marginBottom: 48 }}>
              <div>
                <div style={{ height: 80, background: "var(--navy)", borderRadius: 12, marginBottom: 12 }} />
                <div className="type-label" style={{ color: "var(--text)" }}>Navy</div>
                <div className="type-caption" style={{ color: "var(--text-light)" }}>--navy #0C1C30</div>
              </div>
              <div>
                <div style={{ height: 80, background: "var(--navy-mid)", borderRadius: 12, marginBottom: 12 }} />
                <div className="type-label" style={{ color: "var(--text)" }}>Navy Mid</div>
                <div className="type-caption" style={{ color: "var(--text-light)" }}>--navy-mid</div>
              </div>
              <div>
                <div style={{ height: 80, background: "var(--gold)", borderRadius: 12, marginBottom: 12 }} />
                <div className="type-label" style={{ color: "var(--text)" }}>Gold</div>
                <div className="type-caption" style={{ color: "var(--text-light)" }}>--gold #A08A4E</div>
              </div>
              <div>
                <div style={{ height: 80, background: "var(--gold-muted)", borderRadius: 12, marginBottom: 12 }} />
                <div className="type-label" style={{ color: "var(--text)" }}>Gold Muted</div>
                <div className="type-caption" style={{ color: "var(--text-light)" }}>--gold-muted</div>
              </div>
            </div>
            <div className="grid-4">
              <div>
                <div style={{ height: 64, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, marginBottom: 12 }} />
                <div className="type-label" style={{ color: "var(--text)" }}>Bg</div>
              </div>
              <div>
                <div style={{ height: 64, background: "var(--cream)", border: "1px solid var(--border)", borderRadius: 12, marginBottom: 12 }} />
                <div className="type-label" style={{ color: "var(--text)" }}>Cream</div>
              </div>
              <div>
                <div style={{ height: 64, background: "var(--white)", border: "1px solid var(--border)", borderRadius: 12, marginBottom: 12 }} />
                <div className="type-label" style={{ color: "var(--text)" }}>White</div>
              </div>
              <div>
                <div style={{ height: 64, background: "var(--text)", borderRadius: 12, marginBottom: 12 }} />
                <div className="type-label" style={{ color: "var(--text)" }}>Text</div>
                <div className="type-caption" style={{ color: "var(--text-light)" }}>--text, --text-mid, --text-light</div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="light-zone" style={{ paddingBottom: 24 }}>
        <div className="container">
          <AnimatedLine />
        </div>
      </section>

      {/* Typography */}
      <section className="light-zone section-pad-lg">
        <div className="container">
          <ScrollReveal>
            <SectionLabel>Typography</SectionLabel>
            <h2 className="type-h2" style={{ color: "var(--text)", marginBottom: 48 }}>
              Type scale
            </h2>
          </ScrollReveal>

          <ScrollReveal>
            <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
              <div>
                <div className="type-caption" style={{ color: "var(--text-light)", marginBottom: 8 }}>type-hero (serif)</div>
                <h1 className="type-hero" style={{ color: "var(--text)" }}>Building value in <em style={{ fontStyle: "italic", color: "var(--gold)" }}>real estate</em></h1>
              </div>
              <div>
                <div className="type-caption" style={{ color: "var(--text-light)", marginBottom: 8 }}>type-h2</div>
                <h2 className="type-h2" style={{ color: "var(--text)" }}>Two pathways to real asset returns</h2>
              </div>
              <div>
                <div className="type-caption" style={{ color: "var(--text-light)", marginBottom: 8 }}>type-h3</div>
                <h3 className="type-h3" style={{ color: "var(--text)" }}>Direct Real Estate Investment</h3>
              </div>
              <div>
                <div className="type-caption" style={{ color: "var(--text-light)", marginBottom: 8 }}>type-h4</div>
                <h4 className="type-h4" style={{ color: "var(--text)" }}>Vertically Integrated</h4>
              </div>
              <div>
                <div className="type-caption" style={{ color: "var(--text-light)", marginBottom: 8 }}>type-stat</div>
                <div className="type-stat" style={{ color: "var(--gold)" }}>$150M+</div>
              </div>
              <div>
                <div className="type-caption" style={{ color: "var(--text-light)", marginBottom: 8 }}>type-body-lg / type-body / type-body-sm</div>
                <p className="type-body-lg" style={{ color: "var(--text-mid)", marginBottom: 12 }}>Large body: 18px, line-height 1.8.</p>
                <p className="type-body" style={{ color: "var(--text-mid)", marginBottom: 12 }}>Body: 16px, line-height 1.75. Use for main copy.</p>
                <p className="type-body-sm" style={{ color: "var(--text-mid)" }}>Small body: 14px. Use for secondary copy.</p>
              </div>
              <div>
                <div className="type-caption" style={{ color: "var(--text-light)", marginBottom: 8 }}>type-label / type-caption / type-nav</div>
                <p className="type-label" style={{ color: "var(--gold)", marginBottom: 8 }}>Section Label · 12px · 3px letter-spacing · UPPERCASE</p>
                <p className="type-caption" style={{ color: "var(--text-light)", marginBottom: 8 }}>Caption · 11px · 2px letter-spacing</p>
                <p className="type-nav" style={{ color: "var(--text-mid)" }}>Nav link style · 13px · 1px letter-spacing</p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="light-zone" style={{ paddingBottom: 24 }}>
        <div className="container">
          <AnimatedLine />
        </div>
      </section>

      {/* Buttons */}
      <section className="light-zone section-pad-lg">
        <div className="container">
          <ScrollReveal>
            <SectionLabel>Buttons</SectionLabel>
            <h2 className="type-h2" style={{ color: "var(--text)", marginBottom: 48 }}>
              Button variants
            </h2>
          </ScrollReveal>

          <ScrollReveal>
            <p className="type-body-sm" style={{ color: "var(--text-mid)", marginBottom: 24 }}>
              Use <code style={{ background: "var(--cream-dark)", padding: "2px 6px", borderRadius: 4 }}>btn-primary</code>, <code style={{ background: "var(--cream-dark)", padding: "2px 6px", borderRadius: 4 }}>btn-secondary</code> on dark zones; <code style={{ background: "var(--cream-dark)", padding: "2px 6px", borderRadius: 4 }}>btn-primary-light</code>, <code style={{ background: "var(--cream-dark)", padding: "2px 6px", borderRadius: 4 }}>btn-outline-light</code> on light zones. Editorial links for inline CTAs.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 32 }}>
              <button type="button" className="btn-primary">Primary <ArrowRight size={16} /></button>
              <button type="button" className="btn-primary-light">Primary (light zone)</button>
              <button type="button" className="btn-outline-light">Outline light</button>
              <a href="#" className="btn-editorial">Editorial link <span className="arrow">&rarr;</span></a>
            </div>
            <div style={{ background: "var(--navy)", padding: 40, borderRadius: 16 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
                <button type="button" className="btn-primary">Primary</button>
                <button type="button" className="btn-secondary">Secondary</button>
                <a href="#" className="btn-editorial-light">Editorial light <span className="arrow">&rarr;</span></a>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="light-zone" style={{ paddingBottom: 24 }}>
        <div className="container">
          <AnimatedLine />
        </div>
      </section>

      {/* Section patterns & layout */}
      <section className="light-zone section-pad-lg">
        <div className="container">
          <ScrollReveal>
            <SectionLabel>Layout</SectionLabel>
            <h2 className="type-h2" style={{ color: "var(--text)", marginBottom: 48 }}>
              Sections and grids
            </h2>
          </ScrollReveal>

          <ScrollReveal>
            <ul className="type-body" style={{ color: "var(--text-mid)", listStyle: "disc", paddingLeft: 24, marginBottom: 32 }}>
              <li><strong>container</strong> — max-width var(--content-max), padding var(--page-x). Wrap all section content.</li>
              <li><strong>section-pad-xl / lg / md / sm</strong> — vertical padding (140px / 120px / 100px / 80px, reduced on mobile).</li>
              <li><strong>editorial-grid</strong> — two columns (240px sidebar + 1fr). Use for section label + content.</li>
              <li><strong>editorial-3col</strong> — 200px + 1fr + 340px. Use for numbered sections with sidebar + card.</li>
              <li><strong>grid-2 / grid-3 / grid-4</strong> — equal columns, 24px gap, responsive.</li>
              <li><strong>dark-zone</strong> — navy background. Add navy-grid-pattern, navy-glow, navy-bottom-fade for hero/depth.</li>
              <li><strong>light-zone / cream-zone</strong> — var(--bg) or var(--cream).</li>
              <li><strong>dark-to-light</strong> — curved transition from navy to light (100px height).</li>
            </ul>
            <div className="editorial-grid" style={{ marginBottom: 24 }}>
              <div><SectionLabel>Example</SectionLabel></div>
              <div>
                <h3 className="type-h3" style={{ color: "var(--text)", marginBottom: 12 }}>Editorial grid</h3>
                <p className="type-body" style={{ color: "var(--text-mid)" }}>Left column holds the section label; right column holds headline and body. Use SectionLabel component for the gold overline.</p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="light-zone" style={{ paddingBottom: 24 }}>
        <div className="container">
          <AnimatedLine />
        </div>
      </section>

      {/* Cards */}
      <section className="cream-zone section-pad-lg">
        <div className="container">
          <ScrollReveal>
            <SectionLabel>Cards</SectionLabel>
            <h2 className="type-h2" style={{ color: "var(--text)", marginBottom: 48 }}>
              Card styles
            </h2>
          </ScrollReveal>

          <ScrollReveal staggerChildren>
            <div className="grid-3" style={{ marginBottom: 48 }}>
              <div className="card">
                <div className="card-number">01</div>
                <h4 className="card-title">Card (light zone)</h4>
                <p className="card-body">White background, subtle border, hover lift. Use .card-number, .card-title, .card-body.</p>
              </div>
              <div className="value-item">
                <div className="value-num">Value item</div>
                <h4 style={{ fontFamily: "var(--font-serif)", fontSize: 23, color: "var(--text)", marginBottom: 10 }}>Centered content</h4>
                <p style={{ fontSize: 14, color: "var(--text-mid)", lineHeight: 1.7 }}>For feature grids with icon + title + short copy.</p>
              </div>
              <div className="test-card">
                <div className="big-q">&ldquo;</div>
                <div className="stars">★★★★★</div>
                <p className="quote-text">&ldquo;Testimonial card with serif quote and star rating.&rdquo;</p>
                <div className="author-name">Author Name</div>
                <div className="author-role">Role</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
              <div className="pillar-card">
                <h4 className="type-h4" style={{ color: "var(--text)", marginBottom: 12 }}>Pillar card</h4>
                <p className="type-body" style={{ color: "var(--text-mid)" }}>Top border accent. First child gets 2px gold border; rest get 1px border.</p>
              </div>
              <div className="pillar-card">
                <h4 className="type-h4" style={{ color: "var(--text)", marginBottom: 12 }}>Second pillar</h4>
                <p className="type-body" style={{ color: "var(--text-mid)" }}>Use for stacked list with emphasis on first item.</p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Dark zone cards + stats */}
      <section className="dark-zone section-pad-lg" style={{ position: "relative", overflow: "hidden" }}>
        <div className="navy-grid-pattern">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="navy-grid-line" style={{ left: `${(i + 1) * 7.14}%` }} />
          ))}
        </div>
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <ScrollReveal>
            <SectionLabel light>On navy</SectionLabel>
            <h2 className="type-h2" style={{ color: "#fff", marginBottom: 32 }}>Card navy &amp; stats</h2>
          </ScrollReveal>
          <ScrollReveal staggerChildren>
            <div className="grid-3" style={{ marginBottom: 48 }}>
              <div className="card-navy">
                <h4 style={{ fontFamily: "var(--font-serif)", fontSize: 22, color: "#fff", marginBottom: 12 }}>Card navy</h4>
                <p style={{ fontSize: 15, color: "var(--navy-text-mid)", lineHeight: 1.75 }}>Subtle border and bg on navy. Use for dark section content blocks.</p>
              </div>
              <div className="card-navy">
                <h4 style={{ fontFamily: "var(--font-serif)", fontSize: 22, color: "#fff", marginBottom: 12 }}>Hover state</h4>
                <p style={{ fontSize: 15, color: "var(--navy-text-mid)", lineHeight: 1.75 }}>Background and border brighten on hover.</p>
              </div>
              <div className="card-navy">
                <h4 style={{ fontFamily: "var(--font-serif)", fontSize: 22, color: "#fff", marginBottom: 12 }}>Icon + copy</h4>
                <p style={{ fontSize: 15, color: "var(--navy-text-mid)", lineHeight: 1.75 }}>Pair with gold-muted icons for consistency.</p>
              </div>
            </div>
            <div className="stats-grid on-navy">
              <div className="stat-cell">
                <div className="stat-num">$150M+</div>
                <div className="stat-lbl">AUM</div>
              </div>
              <div className="stat-cell">
                <div className="stat-num champagne">10%</div>
                <div className="stat-lbl">Preferred return</div>
              </div>
              <div className="stat-cell">
                <div className="stat-num">90 Day</div>
                <div className="stat-lbl">Liquidity</div>
              </div>
              <div className="stat-cell">
                <div className="stat-num">Monthly</div>
                <div className="stat-lbl">Distributions</div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <div className="dark-to-light" />

      {/* CTA banner + Fund card */}
      <section className="light-zone section-pad-lg">
        <div className="container">
          <ScrollReveal>
            <SectionLabel>Banners</SectionLabel>
            <h2 className="type-h2" style={{ color: "var(--text)", marginBottom: 48 }}>
              CTA and fund card
            </h2>
          </ScrollReveal>

          <ScrollReveal>
            <div className="lending-cta-banner" style={{ marginBottom: 48 }}>
              <div>
                <h3>Inline CTA with <em>emphasis</em>.</h3>
                <p>Use lending-cta-banner for a navy gradient block inside a light section. Rounded corners, flex layout.</p>
              </div>
              <button type="button" className="btn-primary">Get Started <ArrowRight size={16} /></button>
            </div>
            <div className="fund-card">
              <span className="fund-badge">Badge</span>
              <h2 className="fund-title">Fund card</h2>
              <p className="fund-desc">Dark gradient card for featured offering. Use fund-badge, fund-title, fund-desc, fund-highlights, fund-highlight.</p>
              <div className="fund-highlights">
                <div className="fund-highlight">
                  <span className="fund-highlight-icon">✓</span>
                  Highlight one
                </div>
                <div className="fund-highlight">
                  <span className="fund-highlight-icon">✓</span>
                  Highlight two
                </div>
              </div>
              <button type="button" className="btn-primary">Primary CTA</button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="light-zone" style={{ paddingBottom: 24 }}>
        <div className="container">
          <AnimatedLine />
        </div>
      </section>

      {/* Components & utilities */}
      <section className="light-zone section-pad-lg">
        <div className="container">
          <ScrollReveal>
            <SectionLabel>Reference</SectionLabel>
            <h2 className="type-h2" style={{ color: "var(--text)", marginBottom: 24 }}>
              Components and utilities
            </h2>
            <p className="type-body" style={{ color: "var(--text-mid)", marginBottom: 32, maxWidth: 680 }}>
              Reusable building blocks. All styles live in <code style={{ background: "var(--cream-dark)", padding: "2px 6px", borderRadius: 4 }}>app/globals/public.css</code> (Design System v3). Typography and tokens are in CSS variables; no Tailwind for brand UI.
            </p>
          </ScrollReveal>

          <ScrollReveal>
            <div className="card" style={{ padding: "32px 40px" }}>
              <h4 className="type-h4" style={{ color: "var(--text)", marginBottom: 16 }}>Components</h4>
              <ul className="type-body-sm" style={{ color: "var(--text-mid)", listStyle: "disc", paddingLeft: 24, lineHeight: 2 }}>
                <li><strong>SectionLabel</strong> — gold overline (light prop on dark zones)</li>
                <li><strong>PageHero</strong> — full-viewport hero with label, headline, body, cta</li>
                <li><strong>FooterCTA</strong> — centered dark-zone CTA with headline, body, primary/secondary CTAs</li>
                <li><strong>ScrollReveal</strong> — wrap content for fade-up on scroll (staggerChildren for grids)</li>
                <li><strong>AnimatedLine</strong> — horizontal line that animates in (light prop on navy)</li>
              </ul>
              <h4 className="type-h4" style={{ color: "var(--text)", marginTop: 28, marginBottom: 16 }}>Key CSS classes</h4>
              <ul className="type-body-sm" style={{ color: "var(--text-mid)", listStyle: "disc", paddingLeft: 24, lineHeight: 2 }}>
                <li>Zones: dark-zone, light-zone, cream-zone, hero-gradient</li>
                <li>Decoration: navy-grid-pattern, navy-glow, navy-bottom-fade, dark-to-light</li>
                <li>Section: section-label, section-eyebrow, section-title, section-desc</li>
                <li>Tags: insight-tag, fund-badge, step-icon, principle-badge</li>
                <li>Animation: reveal, visible, reveal-delay-1…4, reveal-children</li>
                <li>Spacing: section-gap-sm/md/lg, max-prose</li>
              </ul>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="dark-zone" style={{ padding: "100px 0", position: "relative", overflow: "hidden" }}>
        <div className="navy-grid-pattern">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="navy-grid-line" style={{ left: `${(i + 1) * 7.14}%` }} />
          ))}
        </div>
        <div className="container" style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <SectionLabel light>End</SectionLabel>
          <h2 className="type-h2" style={{ color: "#fff", marginBottom: 16 }}>
            Use this guide to keep new pages consistent.
          </h2>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 17, color: "var(--navy-text-mid)", maxWidth: 480, margin: "0 auto 32px" }}>
            Add new sections by reusing zones, type classes, and card patterns from this page.
          </p>
          <Link href="/" className="btn-primary">Back to Home <ArrowRight size={16} /></Link>
        </div>
      </section>
    </main>
  );
}
