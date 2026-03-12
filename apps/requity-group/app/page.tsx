import Link from "next/link";
import { fetchSiteData } from "../lib/supabase";
import { renderEmText } from "../lib/renderEmText";
import type {
  PageSection,
  SiteStat,
  Testimonial,
  SiteValue,
  Insight,
} from "../lib/types";
import StatsBar from "./components/StatsBar";
import ScrollReveal from "./components/ScrollReveal";
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
      {/* Hero */}
      <section
        className="dark-zone"
        style={{
          paddingTop: "clamp(160px, 20vw, 220px)",
          paddingBottom: "clamp(100px, 14vw, 160px)",
        }}
      >
        <div className="container">
          <p
            className="section-eyebrow"
            style={{ animation: "fadeUp 0.8s ease forwards" }}
          >
            {hero?.subheading}
          </p>
          <h1
            className="section-title section-title-light"
            style={{
              fontSize: "clamp(40px, 5.5vw, 60px)",
              maxWidth: 720,
              animation: "fadeUp 0.8s 0.1s ease both",
            }}
          >
            {renderEmText(hero?.heading)}
          </h1>
          <p
            className="section-desc section-desc-light"
            style={{
              maxWidth: 560,
              animation: "fadeUp 0.8s 0.2s ease both",
            }}
          >
            {hero?.body_text}
          </p>
          <div
            style={{
              display: "flex",
              gap: 16,
              marginTop: 44,
              animation: "fadeUp 0.8s 0.3s ease both",
              flexWrap: "wrap",
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

      {/* Stats */}
      <section
        className="dark-zone"
        style={{ paddingTop: 0, paddingBottom: 0 }}
      >
        <div className="container">
          <StatsBar stats={stats} />
        </div>
      </section>

      {/* Curve transition */}
      <div className="dark-to-light" />

      {/* What We Do */}
      <section className="light-zone section-gap-lg">
        <div className="container">
          <ScrollReveal>
            <p className="section-eyebrow section-eyebrow-dark">What We Do</p>
            <h2 className="section-title">
              {renderEmText(whatWeDo?.heading)}
            </h2>
            <p className="section-desc" style={{ marginBottom: 56 }}>
              {whatWeDo?.body_text}
            </p>
          </ScrollReveal>
          <ScrollReveal staggerChildren>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: 24,
              }}
            >
              {cards.map((card, i) => (
                <div key={i} className="card">
                  <div className="card-number">0{i + 1}</div>
                  <h3 className="card-title">{card.title}</h3>
                  <p className="card-body">{card.description}</p>
                  <div className="card-metric">{card.metric}</div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Bridge Loan CTA */}
      {bridgeCta && (
        <section className="light-zone section-gap-sm">
          <div className="container">
            <ScrollReveal>
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
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {featuredTestimonials.length > 0 && (
        <section className="light-zone section-gap-md">
          <div className="container">
            <ScrollReveal>
              <p className="section-eyebrow section-eyebrow-dark">
                Investor Testimonials
              </p>
              <h2 className="section-title" style={{ marginBottom: 48 }}>
                What Our <em>Investors</em> Say
              </h2>
            </ScrollReveal>
            <ScrollReveal staggerChildren>
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
                    <div className="stars">{"★".repeat(t.rating)}</div>
                    <p className="quote-text">&ldquo;{t.quote}&rdquo;</p>
                    <div className="author-name">{t.author_name}</div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* Values */}
      {values.length > 0 && (
        <section className="light-zone section-gap-md">
          <div className="container">
            <ScrollReveal>
              <p className="section-eyebrow section-eyebrow-dark">Our Values</p>
              <h2 className="section-title" style={{ marginBottom: 48 }}>
                What <em>Drives</em> Us
              </h2>
            </ScrollReveal>
            <ScrollReveal staggerChildren>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 20,
                }}
              >
                {values.map((v) => (
                  <div key={v.id} className="value-item">
                    <div style={{ color: "var(--champagne-dk)", marginBottom: 14 }}>
                      {VALUE_ICONS[v.icon_identifier ?? ""] ?? null}
                    </div>
                    <h4>{v.title}</h4>
                    <p>{v.description}</p>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* Insights */}
      {recentInsights.length > 0 && (
        <section className="light-zone section-gap-md">
          <div className="container">
            <ScrollReveal>
              <p className="section-eyebrow section-eyebrow-dark">Insights</p>
              <h2 className="section-title" style={{ marginBottom: 48 }}>
                Recent <em>Insights</em>
              </h2>
            </ScrollReveal>
            <ScrollReveal staggerChildren>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                  gap: 24,
                }}
              >
                {recentInsights.map((insight) => (
                  <div key={insight.id} className="card">
                    <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                      {insight.tags?.map((tag) => (
                        <span key={tag} className="insight-tag">{tag}</span>
                      ))}
                    </div>
                    <h3 className="card-title" style={{ fontSize: 21 }}>
                      {insight.title}
                    </h3>
                    <p className="card-body">{insight.excerpt}</p>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}
    </main>
  );
}
