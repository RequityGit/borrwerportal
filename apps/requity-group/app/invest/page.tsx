import type { Metadata } from "next";
import Link from "next/link";
import { fetchSiteData } from "../../lib/supabase";
import type { PageSection, SiteStat, Testimonial } from "../../lib/types";
import {
  ArrowRight,
  Layers,
  Users,
  TrendingUp,
  ShieldCheck,
  Calendar,
  DollarSign,
  Lock,
  BarChart3,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Invest",
  description:
    "Invest in value-add real estate with Requity Group. Access institutional-quality investments through our vertically integrated platform.",
};

export const revalidate = 300;

const BENEFIT_ICONS: Record<string, React.ReactNode> = {
  "Vertically Integrated": <Layers size={22} />,
  "Investor-First Approach": <Users size={22} />,
  "Proven Track Record": <TrendingUp size={22} />,
  "Asset-Backed Security": <ShieldCheck size={22} />,
};

const FUND_HIGHLIGHTS = [
  { icon: <Calendar size={20} />, label: "Monthly Distributions" },
  { icon: <DollarSign size={20} />, label: "$70M+ Capital Raised" },
  { icon: <Lock size={20} />, label: "Accredited Investors Only" },
  { icon: <BarChart3 size={20} />, label: "Asset-Backed Real Estate" },
];

export default async function InvestPage() {
  const [sections, stats, testimonials] = await Promise.all([
    fetchSiteData<PageSection>("site_page_sections", {
      filter: { page_slug: "invest" },
    }),
    fetchSiteData<SiteStat>("site_stats", {
      filter: { page_slug: "home" },
    }),
    fetchSiteData<Testimonial>("site_testimonials", {
      eq: ["is_published", true],
    }),
  ]);

  const hero = sections.find((s) => s.section_key === "hero");
  const whySection = sections.find((s) => s.section_key === "why");
  const benefits = (whySection?.metadata?.benefits as Array<{ title: string; description: string }>) ?? [];

  return (
    <main>
      {/* ── Hero ── */}
      <section
        className="dark-zone"
        style={{
          paddingTop: "clamp(140px, 18vw, 200px)",
          paddingBottom: "clamp(60px, 8vw, 100px)",
        }}
      >
        <div className="container">
          <p className="section-eyebrow" style={{ animation: "fadeUp 0.8s ease forwards" }}>
            {hero?.subheading}
          </p>
          <h1
            className="section-title section-title-light"
            style={{
              fontSize: "clamp(38px, 5vw, 56px)",
              maxWidth: 680,
              animation: "fadeUp 0.8s 0.1s ease both",
            }}
          >
            {renderEmText(hero?.heading)}
          </h1>
          <p
            className="section-desc section-desc-light"
            style={{ maxWidth: 560, animation: "fadeUp 0.8s 0.2s ease both" }}
          >
            {hero?.body_text}
          </p>
          <div
            style={{
              display: "flex",
              gap: 16,
              marginTop: 36,
              animation: "fadeUp 0.8s 0.3s ease both",
            }}
          >
            <a href="#access" className="btn-primary">
              Request Access <ArrowRight size={16} />
            </a>
            <Link href="/about" className="btn-secondary">
              About Requity
            </Link>
          </div>
        </div>
      </section>

      <div className="dark-to-light" />

      {/* ── Why Invest ── */}
      <section className="light-zone" style={{ paddingTop: 60 }}>
        <div className="container">
          <p className="section-eyebrow section-eyebrow-dark">Why Requity</p>
          <h2 className="section-title">
            {renderEmText(whySection?.heading)}
          </h2>
          <p className="section-desc" style={{ marginBottom: 48 }}>
            {whySection?.body_text}
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 24,
            }}
          >
            {benefits.map((b) => (
              <div key={b.title} className="value-item">
                <div style={{ color: "var(--champagne-dk)", marginBottom: 12 }}>
                  {BENEFIT_ICONS[b.title] ?? <TrendingUp size={22} />}
                </div>
                <h4>{b.title}</h4>
                <p>{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Income Fund ── */}
      <section className="light-zone" style={{ paddingTop: 20 }}>
        <div className="container">
          <div
            style={{
              background: "linear-gradient(135deg, var(--navy-deep), var(--navy))",
              borderRadius: 18,
              padding: "clamp(32px, 5vw, 56px)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                right: -60,
                top: -60,
                width: 280,
                height: 280,
                borderRadius: "50%",
                background: "rgba(30,65,112,0.15)",
                pointerEvents: "none",
              }}
            />
            <div style={{ position: "relative", zIndex: 1 }}>
              <span
                style={{
                  display: "inline-block",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--navy-deep)",
                  background: "var(--champagne)",
                  padding: "5px 14px",
                  borderRadius: 4,
                  marginBottom: 20,
                }}
              >
                Now Open to Investors
              </span>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(28px, 4vw, 40px)",
                  fontWeight: 500,
                  color: "#fff",
                  marginBottom: 16,
                }}
              >
                Requity Income Fund
              </h2>
              <p
                style={{
                  fontSize: 15,
                  lineHeight: 1.7,
                  color: "rgba(255,255,255,0.45)",
                  maxWidth: 580,
                  marginBottom: 32,
                }}
              >
                A diversified real estate credit fund targeting consistent monthly
                income backed by tangible assets with conservative underwriting.
                The fund deploys capital across bridge loans, manufactured housing,
                RV parks, and multifamily properties.
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                  gap: 16,
                  marginBottom: 32,
                }}
              >
                {FUND_HIGHLIGHTS.map((h, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      color: "rgba(255,255,255,0.55)",
                      fontSize: 13,
                      fontWeight: 500,
                    }}
                  >
                    <span style={{ color: "var(--champagne)" }}>{h.icon}</span>
                    {h.label}
                  </div>
                ))}
              </div>
              <a href="#access" className="btn-primary">
                Request Access <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      {testimonials.length > 0 && (
        <section className="light-zone" style={{ paddingTop: 40 }}>
          <div className="container">
            <p className="section-eyebrow section-eyebrow-dark">Testimonials</p>
            <h2 className="section-title" style={{ marginBottom: 40 }}>
              Trusted by <em>Investors</em>
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
                gap: 24,
              }}
            >
              {testimonials.slice(0, 4).map((t) => (
                <div key={t.id} className="test-card">
                  <div className="big-q">&ldquo;</div>
                  <div className="stars">{"★".repeat(t.rating)}</div>
                  <p className="quote-text">&ldquo;{t.quote}&rdquo;</p>
                  <div className="author-name">{t.author_name}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section id="access" className="light-zone" style={{ paddingTop: 20 }}>
        <div className="container">
          <div className="lending-cta-banner">
            <div>
              <h3>
                Ready to <em>Invest</em>?
              </h3>
              <p>
                Request access to learn more about the Requity Income Fund and
                how you can start earning consistent, asset-backed monthly income.
              </p>
            </div>
            <a
              href="mailto:invest@requitygroup.com"
              className="btn-primary"
            >
              Request Access <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

function renderEmText(text: string | null | undefined) {
  if (!text) return null;
  const emWords = ["Value-Add", "Requity Group", "value-add"];
  let result: React.ReactNode = text;
  for (const word of emWords) {
    if (text.includes(word)) {
      const idx = text.indexOf(word);
      const before = text.slice(0, idx);
      const match = text.slice(idx, idx + word.length);
      const after = text.slice(idx + word.length);
      result = (
        <>
          {before}
          <em>{match}</em>
          {after}
        </>
      );
      break;
    }
  }
  return result;
}
