"use client";

import { ClipboardCheck, ArrowRight } from "lucide-react";
import Link from "next/link";
import { SectionCard } from "../components";

interface UnderwritingTabProps {
  dealId: string;
  dealType: string | null;
}

export function UnderwritingTab({ dealId, dealType }: UnderwritingTabProps) {
  if (dealType === "commercial") {
    return (
      <SectionCard title="Commercial Underwriting" icon={ClipboardCheck}>
        <div className="rounded-lg bg-[#F7F7F8] px-5 py-8 text-center">
          <ClipboardCheck size={40} className="mx-auto text-[#22A861]" />
          <div className="mt-3 mb-1.5 text-[15px] font-semibold text-[#1A1A1A] font-sans">
            Commercial Underwriting Worksheet
          </div>
          <div className="mb-5 text-[13px] text-[#6B6B6B] font-sans">
            Income analysis, rent roll, T-12 historicals, pro forma, and
            financing summary.
          </div>
          <Link
            href={`/admin/loans/${dealId}/commercial-uw`}
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-medium font-sans border-none bg-[#1A1A1A] text-white hover:bg-[#333] no-underline cursor-pointer"
          >
            Open Underwriting
            <ArrowRight size={15} />
          </Link>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Underwriting Worksheet" icon={ClipboardCheck}>
      <div className="rounded-lg bg-[#F7F7F8] px-5 py-10 text-center">
        <ClipboardCheck size={40} className="mx-auto text-[#8B8B8B]" />
        <div className="mt-3 mb-1.5 text-[15px] font-semibold text-[#1A1A1A] font-sans">
          Underwriting Module
        </div>
        <div className="text-[13px] text-[#6B6B6B] font-sans">
          Underwriting worksheets are not yet available for this loan type.
        </div>
      </div>
    </SectionCard>
  );
}
