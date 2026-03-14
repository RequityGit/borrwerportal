"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UwFieldDef } from "./pipeline-types";

function formatCurrencyDisplay(val: unknown): string {
  if (val == null || val === "") return "";
  const n = Number(val);
  if (isNaN(n)) return String(val);
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function parseCurrencyInput(raw: string): number | null {
  const stripped = raw.replace(/[^0-9.\-]/g, "");
  if (stripped === "" || stripped === "-") return null;
  const n = Number(stripped);
  return isNaN(n) ? null : n;
}

const FLOOD_RISK_OPTIONS = [
  { value: "none", label: "None", className: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" },
  { value: "minimal", label: "Zone X", className: "bg-amber-500/15 text-amber-500 border-amber-500/30" },
  { value: "high", label: "SFHA", className: "bg-red-500/15 text-red-500 border-red-500/30" },
] as const;

function FloodRiskControl({
  value,
  onChange,
  disabled,
}: {
  value: string | null;
  onChange: (val: string) => void;
  disabled?: boolean;
}) {
  const current = value ?? "none";

  return (
    <div className="flex rounded-lg border overflow-hidden h-9">
      {FLOOD_RISK_OPTIONS.map((opt) => {
        const active = current === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={`flex-1 text-xs font-medium transition-colors border-r last:border-r-0 ${
              active
                ? opt.className
                : "text-muted-foreground hover:bg-muted/50"
            } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function CurrencyField({
  field,
  value,
  onChange,
  onBlur,
  disabled,
}: {
  field: UwFieldDef;
  value: unknown;
  onChange: (val: unknown) => void;
  onBlur: () => void;
  disabled?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [rawText, setRawText] = useState("");

  const handleFocus = useCallback(() => {
    setEditing(true);
    setRawText(value != null && value !== "" ? String(value) : "");
  }, [value]);

  const handleBlur = useCallback(() => {
    setEditing(false);
    onBlur();
  }, [onBlur]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const text = e.target.value;
      setRawText(text);
      onChange(parseCurrencyInput(text));
    },
    [onChange]
  );

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{field.label}</Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          $
        </span>
        <Input
          type="text"
          inputMode="decimal"
          value={editing ? rawText : formatCurrencyDisplay(value)}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          className="pl-7 text-right num"
          placeholder="0"
        />
      </div>
    </div>
  );
}

interface UwFieldProps {
  field: UwFieldDef;
  value: unknown;
  onChange: (val: unknown) => void;
  onBlur: () => void;
  disabled?: boolean;
}

export function UwField({ field, value, onChange, onBlur, disabled }: UwFieldProps) {
  switch (field.type) {
    case "currency":
      return (
        <CurrencyField
          field={field}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
        />
      );
    case "percent":
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">{field.label}</Label>
          <div className="relative">
            <Input
              type="number"
              step="0.01"
              value={value != null ? String(value) : ""}
              onChange={(e) =>
                onChange(e.target.value ? Number(e.target.value) : null)
              }
              onBlur={onBlur}
              disabled={disabled}
              className="pr-7 text-right num"
              placeholder="0.00"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              %
            </span>
          </div>
        </div>
      );
    case "number":
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">{field.label}</Label>
          <Input
            type="number"
            value={value != null ? String(value) : ""}
            onChange={(e) =>
              onChange(e.target.value ? Number(e.target.value) : null)
            }
            onBlur={onBlur}
            disabled={disabled}
            className="num"
            placeholder="0"
          />
        </div>
      );
    case "boolean":
      return (
        <div className="flex items-center justify-between py-2">
          <Label className="text-xs">{field.label}</Label>
          <Switch
            checked={!!value}
            onCheckedChange={(checked) => {
              onChange(checked);
              setTimeout(onBlur, 0);
            }}
            disabled={disabled}
          />
        </div>
      );
    case "flood_risk":
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">{field.label}</Label>
          <FloodRiskControl
            value={value as string | null}
            onChange={(val) => {
              onChange(val);
              setTimeout(onBlur, 0);
            }}
            disabled={disabled}
          />
        </div>
      );
    case "select":
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">{field.label}</Label>
          <Select
            value={value != null ? String(value) : ""}
            onValueChange={(val) => {
              onChange(val);
              setTimeout(onBlur, 0);
            }}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {(field.options ?? []).map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    case "date":
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">{field.label}</Label>
          <DatePicker
            value={value != null ? String(value) : ""}
            onChange={(val) => {
              onChange(val || null);
              setTimeout(onBlur, 0);
            }}
            disabled={disabled}
          />
        </div>
      );
    default:
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">{field.label}</Label>
          <Input
            type="text"
            value={value != null ? String(value) : ""}
            onChange={(e) => onChange(e.target.value || null)}
            onBlur={onBlur}
            disabled={disabled}
            placeholder={field.label}
          />
        </div>
      );
  }
}
