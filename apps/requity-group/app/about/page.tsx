import type { Metadata } from "next";
import { fetchSiteData } from "../../lib/supabase";
import { renderEmText } from "../../lib/renderEmText";
import type {
  PageSection,
  SiteStat,
  TeamMember,
  SiteValue,
  Testimonial,
} from "../../lib/types";
import StatsBar from "../components/StatsBar";
import ScrollReveal from "../components/ScrollReveal";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about Requity Group, a vertically integrated real estate investment company with deep operational expertise.",
};

export const revalidate = 300;

export default async function AboutPage() {
  const [sections, stats, team, values, testimonials] = await Promise.all([
    fetchSiteData<PageSection>("site_page_sections", {
      filter: { page_slug: "about" },
    }),
    fetchSiteData<SiteStat>("site_stats", {
      filter: { page_slug: "home" },
    }),
    fetchSiteData<TeamMember>("site_team_members", {
      eq: ["is_published", true],
    }),
    fetchSiteData<SiteValue>("site_values", {
      eq: ["is_published", true],
    }),
    fetchSiteData<Testimonial>("site_testimonials", {
      eq: ["is_published", true],
    }),
  ]);

  const hero = sections.find((s) => s.section_key === "hero");
  const mission = sections.find((s) => s.section_key === "mission");
  const pillars = (mission?.metadata?.pillars as Array<{ title: string; description: string }>) ?? [];

  return (
    <main>
      {/* Hero */}
      <section
        className="dark-zone"
        style={{
          paddingTop: "clamp(160px, 20vw, 220px)",
          paddingBottom: "clamp(80px, 10vw, 120px)",
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
              maxWidth: 740,
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
        </div>
      </section>

      {/* Stats */}
      <section className="dark-zone" style={{ paddingTop: 0, paddingBottom: 0 }}>
        <div className="container">
          <StatsBar stats={stats} />
        </div>
      </section>

      <div className="dark-to-light" />

      {/* Mission & Pillars */}
      <section className="light-zone section-gap-lg">
        <div className="container">
          <ScrollReveal>
            <p className="section-eyebrow section-eyebrow-dark">Our Approach</p>
            <h2 className="section-title">
              {renderEmText(mission?.heading)}
            </h2>
            <p className="section-desc" style={{ marginBottom: 56 }}>
              {mission?.body_text}
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
              {pillars.map((pillar, i) => (
                <div key={i} className="card">
                  <div className="card-number">0{i + 1}</div>
                  <h3 className="card-title">{pillar.title}</h3>
                  <p className="card-body">{pillar.description}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Team */}
      <section id="team" className="light-zone section-gap-md">
        <div className="container">
          <ScrollReveal>
            <p className="section-eyebrow section-eyebrow-dark">Leadership</p>
            <h2 className="section-title" style={{ marginBottom: 48 }}>
              Our <em>Team</em>
            </h2>
          </ScrollReveal>
          <ScrollReveal staggerChildren>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 24,
              }}
            >
              {team.map((member) => (
                <div key={member.id} className="card" style={{ textAlign: "center" }}>
                  <div className="team-avatar">
                    {member.name
                      .split(" ")
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div className="team-name">{member.name}</div>
                  <p className="team-title">{member.title}</p>
                  <p className="team-bio">{member.bio}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Values */}
      <section id="values" className="light-zone section-gap-md">
        <div className="container">
          <ScrollReveal>
            <p className="section-eyebrow section-eyebrow-dark">Core Values</p>
            <h2 className="section-title" style={{ marginBottom: 48 }}>
              What We <em>Stand For</em>
            </h2>
          </ScrollReveal>
          <ScrollReveal staggerChildren>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 20,
              }}
            >
              {values.map((v, i) => (
                <div key={v.id} className="value-item">
                  <div className="value-num">0{i + 1}</div>
                  <h4>{v.title}</h4>
                  <p>{v.description}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="light-zone section-gap-md">
          <div className="container">
            <ScrollReveal>
              <p className="section-eyebrow section-eyebrow-dark">Testimonials</p>
              <h2 className="section-title" style={{ marginBottom: 48 }}>
                From Our <em>Investors</em>
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
                {testimonials.map((t) => (
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
    </main>
  );
}
