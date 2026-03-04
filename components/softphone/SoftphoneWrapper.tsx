"use client";

import { SoftphoneProvider } from "@/lib/twilio/softphone-context";
import { SoftphoneWidget } from "./SoftphoneWidget";

export function SoftphoneWrapper() {
  return (
    <SoftphoneProvider>
      <SoftphoneWidget />
    </SoftphoneProvider>
  );
}
