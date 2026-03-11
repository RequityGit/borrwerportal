import Link from "next/link";
import { fetchSiteData } from "../lib/supabase";
import type {
  PageSection,
  SiteStat,
  Testimonial,
  SiteValue,
  Insight,
} from "../lib/types";
import StatsBar from "./components/StatsBar";
import { ArrowRight, Eye, Shield, TrendingUp, Heart } from "lucide-react";

export const revalidate = 300;

const VALUE_ICONS: Record<string, React.ReactNode> = {
  eye: <Eye size={22} />,
  shield: <Shield size={22} />,
  "trending-up": <TrendingUp size={22} />,
  heart: <Heart size={22} />,
};

export default async function HomePage() {
  const [sections, stats, testimonials, values, insights] = await Promise.all([
    fetchSiteData<PageSection>("site_page_sections", {
      filter: { page_slug: "home" },
    }),
    fetchSiteData<SiteStat>("site_stats", {
      filter: { page_slug: "home" },
    }),
    fetchSiteData<Testimonial>("site_testimonials", {
      eq: ["is_published", true],
    }),
    fetchSiteData<SiteValue>("site_values", {
      eq: ["is_published", true],
    }),
    fetchSiteData<Insight>("site_insights", {
      eq: ["is_published", true],
    }),
  ]);

  const hero = sections.find((s) => s.section_key === "hero");
  const whatWeDo = sections.find((s) => s.section_key === "what_we_do");
  const bridgeCta = sections.find((s) => s.section_key === "bridge_cta");
  const cards = (whatWeDo?.metadata?.cards as Array<{ title: string; description: string; metric: string }>) ?? [];
  const featuredTestimonials = testimonials.filter((t) => t.is_featured).slice(0, 2);
  const recentInsights = insights.slice(0, 3);

  return (
    <main>
      {/* ── Hero ── */}
      <section
        className="dark-zone"
        style={{
          paddingTop: "clamp(140px, 18vw, 200px)",
          paddingBottom: "clamp(80px, 12vw, 140px)",
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
            style={{ animation: "fadeUp 0.8s 0.2s ease both" }}
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
            {hero?.cta_text && hero?.cta_url && (
              <Link href={hero.cta_url} className="btn-primary">
                {hero.cta_text} <ArrowRight size={16} />
              </Link>
            )}
            <Link href="/lending" className="btn-secondary">
              Lending
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section
        className="dark-zone"
        style={{ paddingTop: 0, paddingBottom: 0 }}
      >
        <div className="container">
          <StatsBar stats={stats} />
        </div>
      </section>

      {/* ── Curve transition ── */}
      <div className="dark-to-light" />

      {/* ── What We Do ── */}
      <section className="light-zone" style={{ paddingTop: 60 }}>
        <div className="container">
          <p className="section-eyebrow section-eyebrow-dark">What We Do</p>
          <h2 className="section-title">
            {renderEmText(whatWeDo?.heading)}
          </h2>
          <p className="section-desc" style={{ marginBottom: 48 }}>
            {whatWeDo?.body_text}
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 24,
            }}
          >
            {cards.map((card, i) => (
              <div key={i} className="card">
                <div className="value-num">0{i + 1}</div>
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 26,
                    fontWeight: 500,
                    marginBottom: 12,
                    color: "var(--text-dark)",
                  }}
                >
                  {card.title}
                </h3>
                <p
                  style={{
                    fontSize: 14,
                    lineHeight: 1.7,
                    color: "var(--text-muted)",
                    marginBottom: 20,
                  }}
                >
                  {card.description}
                </p>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--champagne-dk)",
                    letterSpacing: "0.04em",
                  }}
                >
                  {card.metric}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bridge Loan CTA ── */}
      {bridgeCta && (
        <section className="light-zone" style={{ paddingTop: 20 }}>
          <div className="container">
            <div className="lending-cta-banner">
              <div>
                <h3>{renderEmText(bridgeCta.heading)}</h3>
                <p>{bridgeCta.body_text}</p>
              </div>
              {bridgeCta.cta_text && bridgeCta.cta_url && (
                <Link href={bridgeCta.cta_url} className="btn-primary">
                  {bridgeCta.cta_text} <ArrowRight size={16} />
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Testimonials ── */}
      {featuredTestimonials.length > 0 && (
        <section className="light-zone" style={{ paddingTop: 20 }}>
          <div className="container">
            <p className="section-eyebrow section-eyebrow-dark">
              Investor Testimonials
            </p>
            <h2 className="section-title" style={{ marginBottom: 40 }}>
              What Our <em>Investors</em> Say
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
                gap: 24,
              }}
            >
              {featuredTestimonials.map((t) => (
                <div key={t.id} className="test-card">
                  <div className="big-q">&ldquo;</div>
                  <div className="stars">
                    {"★".repeat(t.rating)}
                  </div>
                  <p className="quote-text">&ldquo;{t.quote}&rdquo;</p>
                  <div className="author-name">{t.author_name}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Values ── */}
      {values.length > 0 && (
        <section className="light-zone" style={{ paddingTop: 20 }}>
          <div className="container">
            <p className="section-eyebrow section-eyebrow-dark">Our Values</p>
            <h2 className="section-title" style={{ marginBottom: 40 }}>
              What <em>Drives</em> Us
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 20,
              }}
            >
              {values.map((v) => (
                <div key={v.id} className="value-item">
                  <div
                    style={{
                      color: "var(--champagne-dk)",
                      marginBottom: 12,
                    }}
                  >
                    {VALUE_ICONS[v.icon_identifier ?? ""] ?? null}
                  </div>
                  <h4>{v.title}</h4>
                  <p>{v.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Insights ── */}
      {recentInsights.length > 0 && (
        <section className="light-zone" style={{ paddingTop: 20 }}>
          <div className="container">
            <p className="section-eyebrow section-eyebrow-dark">Insights</p>
            <h2 className="section-title" style={{ marginBottom: 40 }}>
              Recent <em>Insights</em>
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: 24,
              }}
            >
              {recentInsights.map((insight) => (
                <div key={insight.id} className="card">
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      marginBottom: 12,
                    }}
                  >
                    {insight.tags?.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: "var(--champagne-dk)",
                          background: "rgba(198,169,98,0.08)",
                          padding: "4px 10px",
                          borderRadius: 4,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 20,
                      fontWeight: 500,
                      marginBottom: 8,
                      color: "var(--text-dark)",
                    }}
                  >
                    {insight.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 14,
                      color: "var(--text-muted)",
                      lineHeight: 1.6,
                    }}
                  >
                    {insight.excerpt}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

/** Converts text with *word* patterns into <em> elements */
function renderEmText(text: string | null | undefined) {
  if (!text) return null;
  // Split on words wrapped in *asterisks*
  const parts = text.split(/\*(.*?)\*/g);
  if (parts.length === 1) {
    // Also check for words that are naturally italic-worthy
    const emWords = ["value-add", "determined", "bridge loan"];
    let result: React.ReactNode = text;
    for (const word of emWords) {
      if (text.toLowerCase().includes(word)) {
        const idx = text.toLowerCase().indexOf(word);
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
  return parts.map((part, i) =>
    i % 2 === 1 ? <em key={i}>{part}</em> : part
  );
}
