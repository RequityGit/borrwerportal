"use client";

import { Phone } from "lucide-react";
import { useSoftphoneMaybe } from "@/lib/twilio/softphone-context";

interface ClickToCallNumberProps {
  number: string;
  className?: string;
}

export function ClickToCallNumber({
  number,
  className,
}: ClickToCallNumberProps) {
  const softphone = useSoftphoneMaybe();

  const canCall = softphone?.status === "ready";
  const isBusy =
    softphone?.status === "on-call" || softphone?.status === "connecting";
  const isOffline = !softphone || softphone.status === "offline";

  const handleClick = () => {
    if (!canCall || !softphone) return;
    const normalized = number.startsWith("+")
      ? number
      : `+1${number.replace(/\D/g, "")}`;
    softphone.makeOutboundCall(normalized);
  };

  const title = isOffline
    ? "Softphone disconnected"
    : isBusy
      ? "Already on a call"
      : canCall
        ? `Call ${number}`
        : "";

  return (
    <button
      onClick={handleClick}
      disabled={!canCall}
      title={title}
      className={`inline-flex items-center gap-1.5 text-xs group transition-colors ${
        canCall
          ? "text-[#6B6B6B] dark:text-[#888888] hover:text-[#2563EB] dark:hover:text-[#3B82F6] cursor-pointer"
          : "text-[#6B6B6B] dark:text-[#888888] cursor-default"
      } ${className || ""}`}
    >
      <Phone
        className={`h-3.5 w-3.5 transition-colors ${
          canCall
            ? "group-hover:text-[#2563EB] dark:group-hover:text-[#3B82F6]"
            : ""
        }`}
        strokeWidth={1.5}
      />
      {number}
    </button>
  );
}
