import type { Metadata } from "next";
import { fetchSiteData } from "../../lib/supabase";
import type {
  PageSection,
  SiteStat,
  TeamMember,
  SiteValue,
  Testimonial,
} from "../../lib/types";
import StatsBar from "../components/StatsBar";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about Requity Group — a vertically integrated real estate investment company with deep operational expertise.",
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
              maxWidth: 700,
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
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="dark-zone" style={{ paddingTop: 0, paddingBottom: 0 }}>
        <div className="container">
          <StatsBar stats={stats} />
        </div>
      </section>

      <div className="dark-to-light" />

      {/* ── Mission & Pillars ── */}
      <section className="light-zone" style={{ paddingTop: 60 }}>
        <div className="container">
          <p className="section-eyebrow section-eyebrow-dark">Our Approach</p>
          <h2 className="section-title">
            {renderEmText(mission?.heading)}
          </h2>
          <p className="section-desc" style={{ marginBottom: 48 }}>
            {mission?.body_text}
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 24,
            }}
          >
            {pillars.map((pillar, i) => (
              <div key={i} className="card">
                <div className="value-num">0{i + 1}</div>
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 24,
                    fontWeight: 500,
                    marginBottom: 12,
                    color: "var(--text-dark)",
                  }}
                >
                  {pillar.title}
                </h3>
                <p
                  style={{
                    fontSize: 14,
                    lineHeight: 1.7,
                    color: "var(--text-muted)",
                  }}
                >
                  {pillar.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Team ── */}
      <section id="team" className="light-zone" style={{ paddingTop: 20 }}>
        <div className="container">
          <p className="section-eyebrow section-eyebrow-dark">Leadership</p>
          <h2 className="section-title" style={{ marginBottom: 40 }}>
            Our <em>Team</em>
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 24,
            }}
          >
            {team.map((member) => (
              <div key={member.id} className="card" style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, var(--navy-mid), var(--navy-light))",
                    margin: "0 auto 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--champagne)",
                    fontFamily: "var(--font-display)",
                    fontSize: 28,
                    fontWeight: 500,
                  }}
                >
                  {member.name
                    .split(" ")
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join("")}
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 20,
                    fontWeight: 600,
                    color: "var(--text-dark)",
                    marginBottom: 4,
                  }}
                >
                  {member.name}
                </h3>
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--champagne-dk)",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    marginBottom: 16,
                  }}
                >
                  {member.title}
                </p>
                <p
                  style={{
                    fontSize: 13,
                    lineHeight: 1.65,
                    color: "var(--text-muted)",
                    textAlign: "left",
                  }}
                >
                  {member.bio}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section id="values" className="light-zone" style={{ paddingTop: 20 }}>
        <div className="container">
          <p className="section-eyebrow section-eyebrow-dark">Core Values</p>
          <h2 className="section-title" style={{ marginBottom: 40 }}>
            What We <em>Stand For</em>
          </h2>
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
        </div>
      </section>

      {/* ── Testimonials ── */}
      {testimonials.length > 0 && (
        <section className="light-zone" style={{ paddingTop: 20 }}>
          <div className="container">
            <p className="section-eyebrow section-eyebrow-dark">Testimonials</p>
            <h2 className="section-title" style={{ marginBottom: 40 }}>
              From Our <em>Investors</em>
            </h2>
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
          </div>
        </section>
      )}
    </main>
  );
}

function renderEmText(text: string | null | undefined) {
  if (!text) return null;
  const emWords = [
    "Investor-First",
    "Vertically Integrated",
    "value-add",
    "determined",
  ];
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
