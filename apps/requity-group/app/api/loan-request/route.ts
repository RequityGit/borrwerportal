import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { parseCurrency, LOAN_TYPE_CODES } from "@repo/lib";

const supabaseUrl = "https://edhlkknvlczhbowasjna.supabase.co";

function getAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(supabaseUrl, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/* ── Property type mapping ── */
const PROPERTY_TYPE_MAP: Record<string, string> = {
  "Fix & Flip": "Single Family",
  "DSCR Rental": "Single Family",
  "New Construction": "Single Family",
  "CRE Bridge": "Commercial",
  "Manufactured Housing": "Manufactured Housing",
  "RV Park": "RV Park",
  Multifamily: "Multifamily",
};

/* ── Value method from loan type ── */
function valueMethodFromLoanType(loanType: string): string | null {
  const code = LOAN_TYPE_CODES[loanType];
  if (code === "dscr" || code === "guc") return "appraisal_1_arv";
  if (code === "rtl") return "underwritten_arv";
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const {
      loanType,
      propertyAddress,
      city,
      state,
      purchasePrice,
      loanAmount,
      unitsOrLots,
      rehabBudget,
      afterRepairValue,
      timeline,
      creditScore,
      dealsInLast24Months,
      citizenshipStatus,
      firstName,
      lastName,
      email,
      phone,
      company,
      experienceLevel,
      generatedTerms,
    } = data;

    if (!loanType || !firstName || !lastName || !email || !phone || !loanAmount) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    /* ─── CRM Lead Creation ─── */
    const admin = getAdminClient();
    let crmContactId: string | null = null;
    let propertyId: string | null = null;
    let opportunityId: string | null = null;

    if (admin) {
      try {
        // 1. Dedup by email or create new contact
        const { data: existing } = await admin
          .from("crm_contacts")
          .select("id")
          .eq("email", email)
          .is("deleted_at", null)
          .limit(1)
          .single();

        if (existing) {
          crmContactId = existing.id;
        } else {
          const { data: newContact, error: contactErr } = await admin
            .from("crm_contacts")
            .insert({
              contact_number: "",
              contact_type: "lead" as const,
              contact_types: ["borrower"],
              source: "website" as const,
              first_name: firstName,
              last_name: lastName,
              name: `${firstName} ${lastName}`.trim(),
              email,
              phone,
              company_name: company || null,
              city: city || null,
              state: state || null,
            })
            .select("id")
            .single();
          if (contactErr) console.error("CRM contact error:", contactErr.message);
          else crmContactId = newContact?.id ?? null;
        }

        // 2. Create property record
        const units = unitsOrLots ? parseInt(unitsOrLots) : null;
        const { data: propData, error: propErr } = await admin
          .from("properties")
          .insert({
            address_line1: propertyAddress || null,
            city: city || null,
            state: state || null,
            property_type: PROPERTY_TYPE_MAP[loanType] || null,
            number_of_units: Number.isFinite(units) ? units : null,
          })
          .select("id")
          .single();
        if (propErr) console.error("Property error:", propErr.message);
        else propertyId = propData?.id ?? null;

        // 3. Create opportunity (pipeline deal)
        const loanAmountNum = parseCurrency(loanAmount);
        const loanTypeCode = LOAN_TYPE_CODES[loanType] || null;
        const { data: oppData, error: oppErr } = await admin
          .from("opportunities")
          .insert({
            property_id: propertyId,
            deal_name: `${firstName} ${lastName} - ${loanType}`,
            loan_type: loanTypeCode,
            proposed_loan_amount: loanAmountNum > 0 ? loanAmountNum : null,
            proposed_ltv: generatedTerms?.maxLTV || null,
            proposed_interest_rate: generatedTerms?.interestRate || null,
            proposed_loan_term_months: generatedTerms?.loanTermMonths || null,
            funding_channel: "website",
            stage: "new_lead",
            value_method: valueMethodFromLoanType(loanType),
            internal_notes: [
              timeline ? `Timeline: ${timeline}` : null,
              creditScore ? `Credit: ${creditScore}` : null,
              dealsInLast24Months ? `Experience: ${dealsInLast24Months}` : null,
              citizenshipStatus ? `Citizenship: ${citizenshipStatus}` : null,
              experienceLevel ? `Experience Level: ${experienceLevel}` : null,
              purchasePrice ? `Purchase Price: ${purchasePrice}` : null,
              rehabBudget ? `Rehab: ${rehabBudget}` : null,
              afterRepairValue ? `ARV: ${afterRepairValue}` : null,
            ]
              .filter(Boolean)
              .join(" | "),
          })
          .select("id")
          .single();
        if (oppErr) console.error("Opportunity error:", oppErr.message);
        else opportunityId = oppData?.id ?? null;
      } catch (crmErr) {
        console.error("CRM pipeline error:", crmErr);
      }
    }

    /* ─── Email Notifications ─── */
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const notifyEmail = process.env.NOTIFY_EMAIL;

    if (smtpHost && smtpUser && smtpPass && notifyEmail) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: parseInt(process.env.SMTP_PORT || "587") === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });

      const timestamp = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });
      const showRehab = ["Fix & Flip", "New Construction", "CRE Bridge"].includes(loanType);
      const rehabLabel =
        loanType === "New Construction"
          ? "Construction Budget"
          : loanType === "Fix & Flip"
            ? "Rehab Budget"
            : "Rehab/Renovation Budget";
      const unitsLabel = ["Manufactured Housing", "RV Park", "Multifamily"].includes(loanType)
        ? "Number of Units"
        : "Number of Units/Lots";

      const internalHtml = buildInternalEmail({
        loanType, propertyAddress, city, state, purchasePrice, loanAmount,
        unitsOrLots, rehabBudget, afterRepairValue, timeline,
        creditScore, dealsInLast24Months, citizenshipStatus,
        firstName, lastName, email, phone, company, experienceLevel,
        generatedTerms, unitsLabel, showRehab, rehabLabel, timestamp,
        crmContactId, propertyId, opportunityId,
      });

      await transporter.sendMail({
        from: `"Requity Lending" <${smtpUser}>`,
        to: notifyEmail,
        replyTo: email,
        subject: `New Loan Request: ${loanType} - ${firstName} ${lastName}${generatedTerms ? ` [${generatedTerms.programName}]` : ""}`,
        html: internalHtml,
      });

      if (generatedTerms) {
        const customerHtml = buildCustomerTermSheet({
          loanType, propertyAddress, city, state, purchasePrice, loanAmount,
          rehabBudget, afterRepairValue, firstName, generatedTerms, timestamp,
        });
        await transporter.sendMail({
          from: `"Requity Lending" <${smtpUser}>`,
          to: email,
          subject: `Your ${loanType} Loan Terms - ${generatedTerms.programName} | Requity Lending`,
          html: customerHtml,
        });
      }
    } else {
      console.warn("SMTP not configured; skipping email notifications");
    }

    return Response.json({
      success: true,
      message: "Loan request submitted successfully",
      crmContactId,
      propertyId,
      opportunityId,
    });
  } catch (error: unknown) {
    console.error("Loan request error:", error);
    return Response.json({ error: "Failed to submit loan request. Please try again." }, { status: 500 });
  }
}

/* ─── Internal Notification Email Builder ─── */
interface InternalEmailData {
  loanType: string;
  propertyAddress: string;
  city: string;
  state: string;
  purchasePrice: string;
  loanAmount: string;
  unitsOrLots: string;
  rehabBudget: string;
  afterRepairValue: string;
  timeline: string;
  creditScore: string;
  dealsInLast24Months: string;
  citizenshipStatus: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  experienceLevel: string;
  generatedTerms: GeneratedTermsData | null;
  unitsLabel: string;
  showRehab: boolean;
  rehabLabel: string;
  timestamp: string;
  crmContactId: string | null;
  propertyId: string | null;
  opportunityId: string | null;
}

interface GeneratedTermsData {
  programName: string;
  interestRate: number;
  rateType: string;
  originationPoints: number;
  originationFee: number;
  originationFeeFloored: boolean;
  minOriginationFee: number;
  estimatedLoan: number;
  maxLoan: number | null;
  monthlyInterest: number;
  maxLTV: number;
  maxLTC: number;
  maxLTP: number;
  loanTermMonths: number;
  maxTerm: number;
  exitPoints: number;
  exitFee: number;
  legalDocFee: number;
  bpoAppraisalCost: number;
  bpoAppraisalNote: string;
  termNote: string;
}

function buildInternalEmail(d: InternalEmailData) {
  const portalBase = "https://portal.requitygroup.com";
  const crmLink = d.crmContactId ? `${portalBase}/admin/crm/${d.crmContactId}` : null;
  const dealLink = d.opportunityId ? `${portalBase}/admin/pipeline/${d.opportunityId}` : null;

  const crmLinksHtml = crmLink || dealLink ? `
    <div style="padding:16px 40px 24px;">
      <table style="width:100%;border-collapse:collapse;">
        ${crmLink ? `<tr><td style="padding:10px 16px;background:rgba(74,222,128,0.08);border:1px solid rgba(74,222,128,0.2);"><a href="${crmLink}" style="color:#4ade80;font-size:14px;font-weight:600;text-decoration:none;">View Contact in CRM &rarr;</a></td></tr>` : ""}
        ${dealLink ? `<tr><td style="padding:10px 16px;background:rgba(74,222,128,0.08);border:1px solid rgba(74,222,128,0.2);"><a href="${dealLink}" style="color:#4ade80;font-size:14px;font-weight:600;text-decoration:none;">View Deal in Pipeline &rarr;</a></td></tr>` : ""}
      </table>
    </div>` : "";

  const termsSectionHtml = d.generatedTerms ? `
    <div style="padding:0 40px 32px;">
      <h2 style="margin:0 0 20px;font-size:16px;color:#C6A962;letter-spacing:2px;text-transform:uppercase;font-weight:500;">Generated Terms - ${d.generatedTerms.programName}</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:12px 16px;background:rgba(198,169,98,0.08);border:1px solid rgba(198,169,98,0.2);width:40%;"><span style="font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;">Program</span></td><td style="padding:12px 16px;background:rgba(198,169,98,0.08);border:1px solid rgba(198,169,98,0.2);"><span style="font-size:15px;color:#C6A962;font-weight:700;">${d.generatedTerms.programName}</span></td></tr>
        <tr><td style="padding:12px 16px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);"><span style="font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;">Interest Rate</span></td><td style="padding:12px 16px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);"><span style="font-size:15px;color:#ffffff;font-weight:600;">${d.generatedTerms.interestRate}% ${d.generatedTerms.rateType}</span></td></tr>
        <tr><td style="padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);"><span style="font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;">Origination</span></td><td style="padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);"><span style="font-size:15px;color:#ffffff;">${d.generatedTerms.originationPoints}%${d.generatedTerms.originationFee ? " ($" + d.generatedTerms.originationFee.toLocaleString() + ")" : ""}</span></td></tr>
        <tr><td style="padding:12px 16px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);"><span style="font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;">Est. Loan Amount</span></td><td style="padding:12px 16px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);"><span style="font-size:15px;color:#C6A962;font-weight:700;">$${d.generatedTerms.estimatedLoan.toLocaleString()}</span></td></tr>
        <tr><td style="padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);"><span style="font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;">LTV / LTC / LTP</span></td><td style="padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);"><span style="font-size:15px;color:#ffffff;">${d.generatedTerms.maxLTV}% / ${d.generatedTerms.maxLTC}% / ${d.generatedTerms.maxLTP}%</span></td></tr>
      </table>
    </div>` : "";

  const borrowerProfileHtml = d.creditScore ? `
    <div style="padding:0 40px 32px;">
      <h2 style="margin:0 0 20px;font-size:16px;color:#E8622C;letter-spacing:2px;text-transform:uppercase;font-weight:500;">Borrower Profile</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);width:40%;"><span style="font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;">Credit Score</span></td><td style="padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);"><span style="font-size:15px;color:#ffffff;">${d.creditScore}</span></td></tr>
        <tr><td style="padding:12px 16px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);"><span style="font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;">Deals (24 Mo)</span></td><td style="padding:12px 16px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);"><span style="font-size:15px;color:#ffffff;">${d.dealsInLast24Months}</span></td></tr>
        <tr><td style="padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);"><span style="font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;">Citizenship</span></td><td style="padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);"><span style="font-size:15px;color:#ffffff;">${d.citizenshipStatus}</span></td></tr>
      </table>
    </div>` : "";

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0B1526;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:640px;margin:0 auto;background-color:#0B1526;">
  <div style="padding:40px 40px 32px;border-bottom:2px solid #E8622C;">
    <h1 style="margin:0;font-size:28px;font-weight:300;color:#ffffff;letter-spacing:1px;">REQUIT<span style="color:#E8622C;">Y</span> LENDING</h1>
    <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.5);letter-spacing:2px;text-transform:uppercase;">New Loan Request (Website)</p>
  </div>
  <div style="padding:32px 40px 0;">
    <div style="display:inline-block;padding:10px 24px;background-color:rgba(232,98,44,0.15);border:1px solid rgba(232,98,44,0.3);border-radius:4px;">
      <span style="font-size:14px;font-weight:600;color:#E8622C;letter-spacing:1px;text-transform:uppercase;">${d.loanType}</span>
    </div>
  </div>
  ${crmLinksHtml}
  ${termsSectionHtml}
  <div style="padding:32px 40px;">
    <h2 style="margin:0 0 20px;font-size:16px;color:#E8622C;letter-spacing:2px;text-transform:uppercase;font-weight:500;">Contact Information</h2>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);width:40%;"><span style="font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;">Name</span></td><td style="padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);"><span style="font-size:15px;color:#ffffff;font-weight:500;">${d.firstName} ${d.lastName}</span></td></tr>
      <tr><td style="padding:12px 16px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);"><span style="font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;">Email</span></td><td style="padding:12px 16px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);"><a href="mailto:${d.email}" style="font-size:15px;color:#E8622C;text-decoration:none;">${d.email}</a></td></tr>
      <tr><td style="padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);"><span style="font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;">Phone</span></td><td style="padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);"><a href="tel:${d.phone}" style="font-size:15px;color:#E8622C;text-decoration:none;">${d.phone}</a></td></tr>
      ${d.company ? `<tr><td style="padding:12px 16px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);"><span style="font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;">Company</span></td><td style="padding:12px 16px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);"><span style="font-size:15px;color:#ffffff;">${d.company}</span></td></tr>` : ""}
      ${d.experienceLevel ? `<tr><td style="padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);"><span style="font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;">Experience</span></td><td style="padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);"><span style="font-size:15px;color:#ffffff;">${d.experienceLevel}</span></td></tr>` : ""}
    </table>
  </div>
  ${borrowerProfileHtml}
  <div style="padding:0 40px 32px;">
    <h2 style="margin:0 0 20px;font-size:16px;color:#E8622C;letter-spacing:2px;text-transform:uppercase;font-weight:500;">Deal Details</h2>
    <table style="width:100%;border-collapse:collapse;">
      ${d.propertyAddress ? `<tr><td style="padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);width:40%;"><span style="font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;">Property Address</span></td><td style="padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);"><span style="font-size:15px;color:#ffffff;">${d.propertyAddress}</span></td></tr>` : ""}
      ${d.city || d.state ? `<tr><td style="padding:12px 16px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);"><span style="font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;">City / State</span></td><td style="padding:12px 16px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);"><span style="font-size:15px;color:#ffffff;">${d.city}${d.city && d.state ? ", " : ""}${d.state}</span></td></tr>` : ""}
      ${d.purchasePrice ? `<tr><td style="padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);"><span style="font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;">Purchase Price</span></td><td style="padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);"><span style="font-size:15px;color:#ffffff;font-weight:600;">${d.purchasePrice}</span></td></tr>` : ""}
      <tr><td style="padding:12px 16px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);"><span style="font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;">Loan Amount Requested</span></td><td style="padding:12px 16px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);"><span style="font-size:15px;color:#E8622C;font-weight:700;">${d.loanAmount}</span></td></tr>
      ${d.unitsOrLots ? `<tr><td style="padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);"><span style="font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;">${d.unitsLabel}</span></td><td style="padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);"><span style="font-size:15px;color:#ffffff;">${d.unitsOrLots}</span></td></tr>` : ""}
      ${d.showRehab && d.rehabBudget ? `<tr><td style="padding:12px 16px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);"><span style="font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;">${d.rehabLabel}</span></td><td style="padding:12px 16px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);"><span style="font-size:15px;color:#ffffff;">${d.rehabBudget}</span></td></tr>` : ""}
      ${d.afterRepairValue ? `<tr><td style="padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);"><span style="font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;">After Repair Value</span></td><td style="padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);"><span style="font-size:15px;color:#ffffff;font-weight:600;">${d.afterRepairValue}</span></td></tr>` : ""}
      ${d.timeline ? `<tr><td style="padding:12px 16px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);"><span style="font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;">Timeline to Close</span></td><td style="padding:12px 16px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);"><span style="font-size:15px;color:#ffffff;">${d.timeline}</span></td></tr>` : ""}
    </table>
  </div>
  <div style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
    <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.3);">Submitted via requitygroup.com &middot; ${d.timestamp} ET</p>
  </div>
</div></body></html>`;
}

/* ─── Customer Term Sheet Email Builder ─── */
const COMMERCIAL_LOAN_TYPES = ["CRE Bridge", "RV Park", "Multifamily"];

interface CustomerTermSheetData {
  loanType: string;
  propertyAddress: string;
  city: string;
  state: string;
  purchasePrice: string;
  loanAmount: string;
  rehabBudget: string;
  afterRepairValue: string;
  firstName: string;
  generatedTerms: GeneratedTermsData;
  timestamp: string;
}

function buildCustomerTermSheet(d: CustomerTermSheetData) {
  const t = d.generatedTerms;
  const isCommercial = COMMERCIAL_LOAN_TYPES.includes(d.loanType);
  const originationFee = t.originationFee || 0;
  const exitFee = t.exitFee || 0;
  const legalDocFee = t.legalDocFee || 0;
  const bpoAppraisalCost = t.bpoAppraisalCost || 0;
  const bpoAppraisalNote = t.bpoAppraisalNote || "BPO / Appraisal";
  const totalClosingCosts = originationFee + exitFee + legalDocFee + bpoAppraisalCost;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0B1526;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:640px;margin:0 auto;background-color:#0B1526;">
  <div style="padding:40px 40px 32px;border-bottom:2px solid #C6A962;">
    <h1 style="margin:0;font-size:28px;font-weight:300;color:#ffffff;letter-spacing:1px;">REQUIT<span style="color:#C6A962;">Y</span> LENDING</h1>
    <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.5);letter-spacing:2px;text-transform:uppercase;">Your Estimated ${d.loanType} Loan Terms</p>
  </div>
  <div style="padding:32px 40px 16px;">
    <p style="margin:0;font-size:16px;color:rgba(255,255,255,0.8);line-height:1.7;">Hi ${d.firstName},</p>
    <p style="margin:12px 0 0;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.7;">Thank you for your interest in Requity Lending. Based on the information you provided, here are your estimated loan terms:</p>
  </div>
  <div style="padding:16px 40px 24px;">
    <div style="display:inline-block;padding:10px 24px;background-color:rgba(198,169,98,0.15);border:1px solid rgba(198,169,98,0.3);border-radius:4px;">
      <span style="font-size:14px;font-weight:600;color:#C6A962;letter-spacing:1px;text-transform:uppercase;">&#9733; ${t.programName}</span>
    </div>
  </div>
  <div style="padding:0 40px 24px;">
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="width:33.33%;padding:24px 16px;background:rgba(198,169,98,0.06);border:1px solid rgba(198,169,98,0.15);text-align:center;vertical-align:top;"><div style="font-size:32px;font-weight:300;color:#C6A962;line-height:1.1;">${t.interestRate}%</div><div style="font-size:11px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:1px;margin-top:8px;">Interest Rate</div><div style="font-size:10px;color:rgba(255,255,255,0.3);margin-top:3px;">${t.rateType}</div></td>
        <td style="width:33.33%;padding:24px 16px;background:rgba(198,169,98,0.06);border:1px solid rgba(198,169,98,0.15);text-align:center;vertical-align:top;"><div style="font-size:32px;font-weight:300;color:#C6A962;line-height:1.1;">${t.originationPoints}%</div><div style="font-size:11px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:1px;margin-top:8px;">Origination</div></td>
        <td style="width:33.33%;padding:24px 16px;background:rgba(198,169,98,0.06);border:1px solid rgba(198,169,98,0.15);text-align:center;vertical-align:top;"><div style="font-size:32px;font-weight:300;color:#C6A962;line-height:1.1;">${t.loanTermMonths || t.maxTerm}</div><div style="font-size:11px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:1px;margin-top:8px;">Months</div><div style="font-size:10px;color:rgba(255,255,255,0.3);margin-top:3px;">${isCommercial && t.exitPoints > 0 ? t.exitPoints + " exit point" + (t.exitPoints > 1 ? "s" : "") + " at payoff" : t.termNote || ""}</div></td>
      </tr>
    </table>
  </div>
  <div style="padding:0 40px 24px;">
    <h2 style="margin:0 0 16px;font-size:14px;color:#C6A962;letter-spacing:2px;text-transform:uppercase;font-weight:500;">Estimated Loan Details</h2>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:14px 16px;background:rgba(198,169,98,0.08);border:1px solid rgba(198,169,98,0.2);width:50%;"><span style="font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;">Estimated Loan Amount</span></td><td style="padding:14px 16px;background:rgba(198,169,98,0.08);border:1px solid rgba(198,169,98,0.2);text-align:right;"><span style="font-size:20px;color:#C6A962;font-weight:700;">$${t.estimatedLoan.toLocaleString()}</span></td></tr>
      ${t.maxLoan !== null ? `<tr><td style="padding:12px 16px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);"><span style="font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;">Maximum Loan Amount</span></td><td style="padding:12px 16px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);text-align:right;"><span style="font-size:15px;color:#ffffff;">$${t.maxLoan.toLocaleString()}</span></td></tr>` : ""}
      ${t.originationFee ? `<tr><td style="padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);"><span style="font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;">Origination Fee (${t.originationPoints}%)</span></td><td style="padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);text-align:right;"><span style="font-size:15px;color:#ffffff;">$${t.originationFee.toLocaleString()}</span></td></tr>` : ""}
      ${t.monthlyInterest ? `<tr><td style="padding:12px 16px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);"><span style="font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;">Est. Monthly Interest</span></td><td style="padding:12px 16px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);text-align:right;"><span style="font-size:15px;color:#ffffff;">$${t.monthlyInterest.toLocaleString()}</span></td></tr>` : ""}
    </table>
  </div>
  <div style="padding:0 40px 24px;">
    <h2 style="margin:0 0 16px;font-size:14px;color:#C6A962;letter-spacing:2px;text-transform:uppercase;font-weight:500;">Leverage Limits</h2>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);width:50%;"><span style="font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;">Max LTV (% of ARV)</span></td><td style="padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);text-align:right;"><span style="font-size:15px;color:#C6A962;font-weight:600;">${t.maxLTV}%</span></td></tr>
      <tr><td style="padding:12px 16px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);"><span style="font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;">Max LTC (% of Total Cost)</span></td><td style="padding:12px 16px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);text-align:right;"><span style="font-size:15px;color:#C6A962;font-weight:600;">${t.maxLTC}%</span></td></tr>
      <tr><td style="padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);"><span style="font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;">Max LTP (% of Purchase Price)</span></td><td style="padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);text-align:right;"><span style="font-size:15px;color:#C6A962;font-weight:600;">${t.maxLTP}%</span></td></tr>
    </table>
  </div>
  <div style="padding:0 40px 24px;">
    <h2 style="margin:0 0 16px;font-size:14px;color:#C6A962;letter-spacing:2px;text-transform:uppercase;font-weight:500;">Estimated Closing Costs</h2>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);width:50%;"><span style="font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;">Origination Fee</span></td><td style="padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);text-align:right;"><span style="font-size:15px;color:#ffffff;">$${originationFee.toLocaleString()}</span></td></tr>
      <tr><td style="padding:12px 16px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);"><span style="font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;">Exit Fee${isCommercial && t.exitPoints > 0 ? " (" + t.exitPoints + "%)" : ""}</span></td><td style="padding:12px 16px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);text-align:right;"><span style="font-size:15px;color:#ffffff;">$${exitFee.toLocaleString()}</span></td></tr>
      <tr><td style="padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);"><span style="font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;">Legal &amp; Documentation</span></td><td style="padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);text-align:right;"><span style="font-size:15px;color:#ffffff;">$${legalDocFee.toLocaleString()}</span></td></tr>
      <tr><td style="padding:12px 16px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);"><span style="font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;">${bpoAppraisalNote}</span></td><td style="padding:12px 16px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);text-align:right;"><span style="font-size:15px;color:#ffffff;">$${bpoAppraisalCost.toLocaleString()}</span></td></tr>
      <tr><td style="padding:14px 16px;background:rgba(198,169,98,0.08);border:1px solid rgba(198,169,98,0.2);"><span style="font-size:11px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:1px;font-weight:600;">Estimated Total Closing Costs</span></td><td style="padding:14px 16px;background:rgba(198,169,98,0.08);border:1px solid rgba(198,169,98,0.2);text-align:right;"><span style="font-size:18px;color:#C6A962;font-weight:700;">$${totalClosingCosts.toLocaleString()}</span></td></tr>
    </table>
    <div style="padding:12px 0 0;"><p style="margin:0;font-size:11px;color:rgba(255,255,255,0.35);line-height:1.6;">Costs are estimates and subject to change. Final amounts confirmed at closing.</p></div>
  </div>
  <div style="padding:0 40px 32px;">
    <div style="padding:20px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-left:3px solid rgba(198,169,98,0.5);">
      <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.4);line-height:1.7;">These terms are estimates based on the information you provided and are subject to full underwriting review, property appraisal, and final approval. Actual terms may vary. A member of our lending team will reach out to discuss your deal in detail.</p>
    </div>
  </div>
  <div style="padding:0 40px 32px;text-align:center;">
    <p style="margin:0 0 16px;font-size:15px;color:rgba(255,255,255,0.6);">Questions about your terms?</p>
    <a href="tel:+18133275180" style="display:inline-block;padding:14px 36px;background-color:#C6A962;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Call 813.327.5180</a>
  </div>
  <div style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
    <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.3);">&copy; ${new Date().getFullYear()} Requity Group &middot; 401 E Jackson St, Suite 3300, Tampa, FL 33602</p>
    <p style="margin:8px 0 0;font-size:11px;color:rgba(255,255,255,0.2);">Generated ${d.timestamp} ET</p>
  </div>
</div></body></html>`;
}
