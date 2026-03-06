"use client";

import { useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Eye,
  EyeOff,
  Lock,
  ArrowRight,
  ArrowLeft,
  Check,
  Search,
  Loader2,
  FileText,
  Building2,
  Shield,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { publishFieldConfigurations } from "./actions";
import { invalidateFieldConfigCache } from "@/hooks/useFieldConfigurations";
import type { Database } from "@/lib/supabase/types";

type FieldConfigRow = Database["public"]["Tables"]["field_configurations"]["Row"];

interface FieldEntry {
  id: string;
  module: string;
  field_key: string;
  field_label: string;
  field_type: string;
  column_position: "left" | "right";
  display_order: number;
  is_visible: boolean;
  is_locked: boolean;
}

const MODULES = [
  { key: "loan_details", label: "Loan Details", icon: FileText },
  { key: "property", label: "Property", icon: Building2 },
  { key: "borrower_entity", label: "Borrower / Entity", icon: Shield },
] as const;

const TYPE_COLORS: Record<string, string> = {
  text: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  dropdown: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  currency: "bg-green-500/10 text-green-500 border-green-500/20",
  number: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  percentage: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  email: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  phone: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  date: "bg-orange-500/10 text-orange-500 border-orange-500/20",
};

function mapRow(row: FieldConfigRow): FieldEntry {
  return {
    id: row.id,
    module: row.module,
    field_key: row.field_key,
    field_label: row.field_label,
    field_type: row.field_type,
    column_position: row.column_position as "left" | "right",
    display_order: row.display_order,
    is_visible: row.is_visible,
    is_locked: row.is_locked,
  };
}

interface FieldManagerViewProps {
  initialConfigs: FieldConfigRow[];
}

export function FieldManagerView({ initialConfigs }: FieldManagerViewProps) {
  const [activeModule, setActiveModule] = useState<string>("loan_details");
  const [fields, setFields] = useState<Record<string, FieldEntry[]>>(() => {
    const grouped: Record<string, FieldEntry[]> = {};
    for (const mod of MODULES) {
      grouped[mod.key] = initialConfigs
        .filter((c) => c.module === mod.key)
        .map(mapRow)
        .sort((a, b) => a.display_order - b.display_order);
    }
    return grouped;
  });
  const [originalFields, setOriginalFields] = useState<Record<string, FieldEntry[]>>(() => {
    const grouped: Record<string, FieldEntry[]> = {};
    for (const mod of MODULES) {
      grouped[mod.key] = initialConfigs
        .filter((c) => c.module === mod.key)
        .map(mapRow)
        .sort((a, b) => a.display_order - b.display_order);
    }
    return grouped;
  });
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const { toast } = useToast();

  const currentFields = fields[activeModule] ?? [];

  const hasChanges = useMemo(() => {
    return JSON.stringify(fields) !== JSON.stringify(originalFields);
  }, [fields, originalFields]);

  const filteredLeft = currentFields.filter(
    (f) =>
      f.column_position === "left" &&
      (search === "" ||
        f.field_label.toLowerCase().includes(search.toLowerCase()) ||
        f.field_key.toLowerCase().includes(search.toLowerCase()))
  );
  const filteredRight = currentFields.filter(
    (f) =>
      f.column_position === "right" &&
      (search === "" ||
        f.field_label.toLowerCase().includes(search.toLowerCase()) ||
        f.field_key.toLowerCase().includes(search.toLowerCase()))
  );

  const stats = useMemo(() => {
    const total = currentFields.length;
    const visible = currentFields.filter((f) => f.is_visible).length;
    const hidden = total - visible;
    return { total, visible, hidden };
  }, [currentFields]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const updateModuleFields = useCallback(
    (updater: (prev: FieldEntry[]) => FieldEntry[]) => {
      setFields((prev) => ({
        ...prev,
        [activeModule]: updater(prev[activeModule] ?? []),
      }));
    },
    [activeModule]
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      updateModuleFields((prev) => {
        const activeField = prev.find((f) => f.id === active.id);
        const overField = prev.find((f) => f.id === over.id);
        if (!activeField || !overField) return prev;

        // Only reorder within the same column
        if (activeField.column_position !== overField.column_position) return prev;

        const column = activeField.column_position;
        const columnFields = prev
          .filter((f) => f.column_position === column)
          .sort((a, b) => a.display_order - b.display_order);

        const oldIndex = columnFields.findIndex((f) => f.id === active.id);
        const newIndex = columnFields.findIndex((f) => f.id === over.id);

        if (oldIndex === -1 || newIndex === -1) return prev;

        // Move the item
        const reordered = [...columnFields];
        const [moved] = reordered.splice(oldIndex, 1);
        reordered.splice(newIndex, 0, moved);

        // Recalculate display_order for the affected column
        const otherColumn = prev.filter((f) => f.column_position !== column);
        const updated = [
          ...otherColumn,
          ...reordered.map((f, i) => ({ ...f, display_order: i * 2 + (column === "right" ? 1 : 0) })),
        ];

        return updated;
      });
    },
    [updateModuleFields]
  );

  const toggleVisibility = useCallback(
    (fieldId: string) => {
      updateModuleFields((prev) =>
        prev.map((f) => (f.id === fieldId && !f.is_locked ? { ...f, is_visible: !f.is_visible } : f))
      );
    },
    [updateModuleFields]
  );

  const swapColumn = useCallback(
    (fieldId: string) => {
      updateModuleFields((prev) => {
        const field = prev.find((f) => f.id === fieldId);
        if (!field) return prev;
        const newColumn = field.column_position === "left" ? "right" : "left";
        const targetFields = prev.filter((f) => f.column_position === newColumn);
        const maxOrder = targetFields.length > 0 ? Math.max(...targetFields.map((f) => f.display_order)) + 1 : 0;
        return prev.map((f) =>
          f.id === fieldId ? { ...f, column_position: newColumn as "left" | "right", display_order: maxOrder } : f
        );
      });
    },
    [updateModuleFields]
  );

  const handlePublish = useCallback(async () => {
    setIsSaving(true);
    setSavedAt(null);
    try {
      const moduleFields = fields[activeModule] ?? [];
      const result = await publishFieldConfigurations(activeModule, moduleFields);
      if ("error" in result && result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        setSavedAt(Date.now());
        setOriginalFields((prev) => ({ ...prev, [activeModule]: [...moduleFields] }));
        invalidateFieldConfigCache(activeModule);
        setTimeout(() => setSavedAt(null), 3000);
      }
    } finally {
      setIsSaving(false);
    }
  }, [activeModule, fields, toast]);

  const draggedField = activeId ? currentFields.find((f) => f.id === activeId) : null;

  return (
    <div className="flex gap-6">
      {/* Module sidebar */}
      <div className="w-[200px] shrink-0 space-y-1">
        {MODULES.map((mod) => {
          const isActive = activeModule === mod.key;
          const count = (fields[mod.key] ?? []).length;
          return (
            <Button
              key={mod.key}
              variant="ghost"
              className={cn(
                "w-full justify-start gap-2.5 text-[13px] font-medium h-9",
                isActive && "bg-sidebar-active text-foreground font-semibold"
              )}
              onClick={() => {
                setActiveModule(mod.key);
                setSearch("");
              }}
            >
              <mod.icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
              <span className="flex-1 text-left">{mod.label}</span>
              <Badge variant="outline" className="h-5 min-w-[22px] px-1.5 text-[10px] num">
                {count}
              </Badge>
            </Button>
          );
        })}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
            <Input
              placeholder="Search fields..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-[13px]"
            />
          </div>
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
            <span className="num">{stats.total}</span> total
            <span className="text-border">|</span>
            <span className="num">{stats.visible}</span> visible
            <span className="text-border">|</span>
            <span className="num">{stats.hidden}</span> hidden
          </div>
          <div className="flex-1" />
          {savedAt && (
            <div className="flex items-center gap-1.5 text-[12px] font-medium" style={{ color: "#1B7A44" }}>
              <Check className="h-3.5 w-3.5" strokeWidth={2} />
              Saved
            </div>
          )}
          <Button
            onClick={handlePublish}
            disabled={!hasChanges || isSaving}
            size="sm"
            className="h-9 text-[13px]"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Saving...
              </>
            ) : (
              "Publish Changes"
            )}
          </Button>
        </div>

        {/* Two-column grid */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-2 gap-4">
            <FieldColumn
              label="Left Column"
              fields={filteredLeft}
              onToggleVisibility={toggleVisibility}
              onSwapColumn={swapColumn}
            />
            <FieldColumn
              label="Right Column"
              fields={filteredRight}
              onToggleVisibility={toggleVisibility}
              onSwapColumn={swapColumn}
            />
          </div>
          <DragOverlay>
            {draggedField ? <FieldCardOverlay field={draggedField} /> : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}

function FieldColumn({
  label,
  fields,
  onToggleVisibility,
  onSwapColumn,
}: {
  label: string;
  fields: FieldEntry[];
  onToggleVisibility: (id: string) => void;
  onSwapColumn: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="text-[11px] uppercase tracking-[0.05em] font-semibold text-muted-foreground px-1">
        {label}
      </div>
      <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-1.5 min-h-[60px]">
          {fields.map((field) => (
            <SortableFieldCard
              key={field.id}
              field={field}
              onToggleVisibility={onToggleVisibility}
              onSwapColumn={onSwapColumn}
            />
          ))}
          {fields.length === 0 && (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-[12px] text-muted-foreground">
              No fields in this column
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

function SortableFieldCard({
  field,
  onToggleVisibility,
  onSwapColumn,
}: {
  field: FieldEntry;
  onToggleVisibility: (id: string) => void;
  onSwapColumn: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 transition-colors",
        isDragging && "opacity-30",
        !field.is_visible && "opacity-50"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="shrink-0 cursor-grab text-muted-foreground hover:text-foreground transition-colors touch-none"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" strokeWidth={1.5} />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-foreground truncate">
            {field.field_label}
          </span>
          {field.is_locked && (
            <Lock className="h-3 w-3 shrink-0 text-muted-foreground" strokeWidth={1.5} />
          )}
        </div>
        <span className="text-[11px] font-mono text-muted-foreground">
          {field.field_key}
        </span>
      </div>

      <Badge
        variant="outline"
        className={cn(
          "shrink-0 text-[10px] px-1.5 py-0 h-5 font-medium",
          TYPE_COLORS[field.field_type] ?? "bg-secondary text-secondary-foreground"
        )}
      >
        {field.field_type}
      </Badge>

      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 shrink-0"
        onClick={() => onSwapColumn(field.id)}
        aria-label={`Move to ${field.column_position === "left" ? "right" : "left"} column`}
      >
        {field.column_position === "left" ? (
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
        ) : (
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
        )}
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 shrink-0"
        onClick={() => onToggleVisibility(field.id)}
        disabled={field.is_locked}
        aria-label={field.is_visible ? "Hide field" : "Show field"}
      >
        {field.is_visible ? (
          <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
        ) : (
          <EyeOff className="h-3.5 w-3.5" strokeWidth={1.5} />
        )}
      </Button>
    </div>
  );
}

function FieldCardOverlay({ field }: { field: FieldEntry }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 shadow-lg">
      <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-foreground truncate">
            {field.field_label}
          </span>
        </div>
        <span className="text-[11px] font-mono text-muted-foreground">
          {field.field_key}
        </span>
      </div>
      <Badge
        variant="outline"
        className={cn(
          "shrink-0 text-[10px] px-1.5 py-0 h-5 font-medium",
          TYPE_COLORS[field.field_type] ?? "bg-secondary text-secondary-foreground"
        )}
      >
        {field.field_type}
      </Badge>
    </div>
  );
}
