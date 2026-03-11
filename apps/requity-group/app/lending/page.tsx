import type { Metadata } from "next";
import Link from "next/link";
import { fetchSiteData } from "../../lib/supabase";
import type { PageSection, LoanProgram } from "../../lib/types";
import {
  ArrowRight,
  Zap,
  CheckCircle,
  HardHat,
  MessageSquare,
  Send,
  FileText,
  Search,
  DollarSign,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Lending",
  description:
    "Real estate lending by real operators. Bridge loans, fix & flip, DSCR, construction, and more. Close in as little as 10 days.",
};

export const revalidate = 300;

const BENEFIT_ICONS: Record<string, React.ReactNode> = {
  "Fast Execution": <Zap size={22} />,
  "Certainty of Close": <CheckCircle size={22} />,
  "Operator Mentality": <HardHat size={22} />,
  "Direct Communication": <MessageSquare size={22} />,
};

const PROCESS_ICONS = [
  <Send key="1" size={22} />,
  <FileText key="2" size={22} />,
  <Search key="3" size={22} />,
  <DollarSign key="4" size={22} />,
];

const PROCESS_STEPS = [
  {
    title: "Submit Your Deal",
    description:
      "Complete our simple loan request form with your deal details. No credit pull, no commitment.",
  },
  {
    title: "Receive a Term Sheet",
    description:
      "Our team reviews your request and issues a term sheet within 24 hours.",
  },
  {
    title: "Underwriting & Diligence",
    description:
      "We conduct property-level due diligence and finalize loan documents.",
  },
  {
    title: "Close & Fund",
    description:
      "Funds are wired at closing. Most deals close in 10-14 days from term sheet acceptance.",
  },
];

export default async function LendingPage() {
  const [sections, programs] = await Promise.all([
    fetchSiteData<PageSection>("site_page_sections", {
      filter: { page_slug: "lending" },
    }),
    fetchSiteData<LoanProgram>("site_loan_programs", {
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
            <a href="#apply" className="btn-primary">
              Submit a Deal <ArrowRight size={16} />
            </a>
            <a href="#programs" className="btn-secondary">
              Loan Programs
            </a>
          </div>
        </div>
      </section>

      <div className="dark-to-light" />

      {/* ── Why Requity Lending ── */}
      <section className="light-zone" style={{ paddingTop: 60 }}>
        <div className="container">
          <p className="section-eyebrow section-eyebrow-dark">Why Us</p>
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
                  {BENEFIT_ICONS[b.title] ?? <Zap size={22} />}
                </div>
                <h4>{b.title}</h4>
                <p>{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Process ── */}
      <section className="light-zone" style={{ paddingTop: 20 }}>
        <div className="container">
          <p className="section-eyebrow section-eyebrow-dark">Our Process</p>
          <h2 className="section-title" style={{ marginBottom: 40 }}>
            From Application to <em>Funding</em>
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 24,
            }}
          >
            {PROCESS_STEPS.map((step, i) => (
              <div key={i} className="card">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      background: "linear-gradient(135deg, var(--navy-mid), var(--navy-light))",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--champagne)",
                    }}
                  >
                    {PROCESS_ICONS[i]}
                  </div>
                  <span className="value-num" style={{ marginBottom: 0 }}>
                    Step {i + 1}
                  </span>
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
                  {step.title}
                </h3>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--text-muted)" }}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Loan Programs ── */}
      <section id="programs" className="light-zone" style={{ paddingTop: 20 }}>
        <div className="container">
          <p className="section-eyebrow section-eyebrow-dark">Loan Programs</p>
          <h2 className="section-title" style={{ marginBottom: 40 }}>
            Flexible Capital <em>Solutions</em>
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 24,
            }}
          >
            {programs.map((program) => (
              <div key={program.id} className="card">
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 22,
                    fontWeight: 500,
                    marginBottom: 8,
                    color: "var(--text-dark)",
                  }}
                >
                  {program.display_name}
                </h3>
                <p
                  style={{
                    fontSize: 14,
                    lineHeight: 1.7,
                    color: "var(--text-muted)",
                    marginBottom: 16,
                  }}
                >
                  {program.description}
                </p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {(program.features as string[]).map((feature, i) => (
                    <li
                      key={i}
                      style={{
                        fontSize: 13,
                        color: "var(--navy-muted)",
                        padding: "6px 0",
                        borderTop: i > 0 ? "1px solid rgba(8,21,37,0.06)" : "none",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <CheckCircle size={14} style={{ color: "var(--champagne-dk)", flexShrink: 0 }} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="apply" className="light-zone" style={{ paddingTop: 20 }}>
        <div className="container">
          <div className="lending-cta-banner">
            <div>
              <h3>
                Have a deal? <em>Let&apos;s talk.</em>
              </h3>
              <p>
                Our lending team is available to discuss your project and provide
                a quick indication of terms. No obligation, no credit pull.
              </p>
            </div>
            <a href="mailto:lending@requitygroup.com" className="btn-primary">
              Contact Lending <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* ── Investor CTA ── */}
      <section className="light-zone" style={{ paddingTop: 20 }}>
        <div className="container">
          <div
            className="lending-cta-banner"
            style={{
              background: "linear-gradient(135deg, var(--champagne-dk), var(--champagne))",
            }}
          >
            <div>
              <h3 style={{ color: "var(--navy-deep)" }}>
                Looking to <em style={{ color: "var(--navy-mid)" }}>Invest</em>, Not Borrow?
              </h3>
              <p style={{ color: "rgba(8,21,37,0.5)" }}>
                Our Income Fund provides accredited investors with consistent
                monthly income backed by the same real estate loans we originate.
              </p>
            </div>
            <Link
              href="/invest"
              className="btn-primary"
              style={{
                background: "var(--navy-deep)",
                color: "var(--champagne)",
              }}
            >
              Learn More <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function renderEmText(text: string | null | undefined) {
  if (!text) return null;
  const emWords = ["Real Operators", "Deal", "value-add"];
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
