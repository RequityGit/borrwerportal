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
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Loader2,
  X,
  Search,
  Landmark,
  TrendingUp,
  UserCircle,
  Shield,
  Contact,
  FileText,
  Zap,
  Users,
  Link,
  MessageCircle,
  Info,
  Building2,
  MapPin,
  Target,
  CreditCard,
  FileCheck,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import {
  publishPageLayout,
  addPageSection,
  deletePageSection,
  type PageSection,
  type PageField,
  type FieldConfigInfo,
} from "../actions";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, LucideIcon> = {
  "landmark": Landmark,
  "trending-up": TrendingUp,
  "user-circle": UserCircle,
  "shield": Shield,
  "contact": Contact,
  "file-text": FileText,
  "zap": Zap,
  "users": Users,
  "link": Link,
  "message-circle": MessageCircle,
  "info": Info,
  "building-2": Building2,
  "map-pin": MapPin,
  "target": Target,
  "credit-card": CreditCard,
  "file-check": FileCheck,
};

const TYPE_COLORS: Record<string, string> = {
  text: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  dropdown: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  currency: "bg-green-500/10 text-green-500 border-green-500/20",
  number: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  percentage: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  email: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  phone: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  date: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  boolean: "bg-teal-500/10 text-teal-500 border-teal-500/20",
  formula: "bg-rose-500/10 text-rose-500 border-rose-500/20",
};

const AVAILABLE_ICONS = Object.keys(ICON_MAP);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SectionState extends PageSection {
  fields: FieldState[];
}

interface FieldState {
  id?: string;
  field_config_id: string | null;
  field_key: string;
  field_label: string;
  field_type: string;
  display_order: number;
  column_position: string;
  is_visible: boolean;
}

interface PageManagerViewProps {
  pageType: string;
  pageTitle: string;
  pageDescription: string;
  initialSections: PageSection[];
  initialFields: PageField[];
  availableFieldConfigs: FieldConfigInfo[];
}

// ---------------------------------------------------------------------------
// Sortable Section
// ---------------------------------------------------------------------------

function SortableSectionCard({
  section,
  isExpanded,
  onToggleExpand,
  onToggleVisibility,
  onDeleteSection,
  onFieldMove,
  onFieldSwapColumn,
  onFieldToggleVisibility,
  onFieldRemove,
  onAddField,
  assignedFieldKeys,
  availableFieldConfigs,
}: {
  section: SectionState;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleVisibility: () => void;
  onDeleteSection: () => void;
  onFieldMove: (sectionId: string, fieldKey: string, direction: "up" | "down") => void;
  onFieldSwapColumn: (sectionId: string, fieldKey: string) => void;
  onFieldToggleVisibility: (sectionId: string, fieldKey: string) => void;
  onFieldRemove: (sectionId: string, fieldKey: string) => void;
  onAddField: (sectionId: string) => void;
  assignedFieldKeys: Set<string>;
  availableFieldConfigs: FieldConfigInfo[];
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const IconComp = ICON_MAP[section.section_icon] ?? FileText;
  const leftFields = section.fields
    .filter((f) => f.column_position === "left")
    .sort((a, b) => a.display_order - b.display_order);
  const rightFields = section.fields
    .filter((f) => f.column_position === "right")
    .sort((a, b) => a.display_order - b.display_order);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-lg border border-border bg-card transition-shadow",
        isDragging && "shadow-lg opacity-80 z-50"
      )}
    >
      {/* Section header */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        >
          <GripVertical size={14} strokeWidth={1.5} />
        </button>

        <button
          onClick={onToggleExpand}
          className="flex items-center gap-2 flex-1 min-w-0 text-left"
        >
          <IconComp size={14} strokeWidth={1.5} className="shrink-0 text-muted-foreground" />
          <span className="text-[13px] font-medium truncate">{section.section_label}</span>
          {section.visibility_rule && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal shrink-0">
              {section.visibility_rule}
            </Badge>
          )}
          <span className="text-[10px] text-muted-foreground shrink-0">
            {section.fields.length} field{section.fields.length !== 1 ? "s" : ""}
          </span>
          {isExpanded ? (
            <ChevronDown size={12} className="shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight size={12} className="shrink-0 text-muted-foreground" />
          )}
        </button>

        <div className="flex items-center gap-1 shrink-0">
          {section.is_locked && (
            <Lock size={12} className="text-muted-foreground" />
          )}
          <button
            onClick={onToggleVisibility}
            disabled={section.is_locked}
            className={cn(
              "p-1 rounded hover:bg-muted transition-colors",
              section.is_locked && "opacity-30 cursor-not-allowed"
            )}
            title={section.is_visible ? "Hide section" : "Show section"}
          >
            {section.is_visible ? (
              <Eye size={13} strokeWidth={1.5} className="text-foreground" />
            ) : (
              <EyeOff size={13} strokeWidth={1.5} className="text-muted-foreground" />
            )}
          </button>
          {!section.is_locked && (
            <button
              onClick={onDeleteSection}
              className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              title="Delete section"
            >
              <Trash2 size={13} strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>

      {/* Expanded field list */}
      {isExpanded && (
        <div className="border-t border-border px-3 py-3 space-y-3">
          {section.fields.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">
              No fields assigned to this section
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {/* Left column */}
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
                  Left Column
                </p>
                {leftFields.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground px-1 py-2">Empty</p>
                ) : (
                  leftFields.map((field, index) => (
                    <FieldCard
                      key={field.field_key}
                      field={field}
                      onSwapColumn={() => onFieldSwapColumn(section.id, field.field_key)}
                      onToggleVisibility={() => onFieldToggleVisibility(section.id, field.field_key)}
                      onRemove={() => onFieldRemove(section.id, field.field_key)}
                      onMoveUp={() => onFieldMove(section.id, field.field_key, "up")}
                      onMoveDown={() => onFieldMove(section.id, field.field_key, "down")}
                      isFirst={index === 0}
                      isLast={index === leftFields.length - 1}
                      swapDirection="right"
                    />
                  ))
                )}
              </div>
              {/* Right column */}
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
                  Right Column
                </p>
                {rightFields.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground px-1 py-2">Empty</p>
                ) : (
                  rightFields.map((field, index) => (
                    <FieldCard
                      key={field.field_key}
                      field={field}
                      onSwapColumn={() => onFieldSwapColumn(section.id, field.field_key)}
                      onToggleVisibility={() => onFieldToggleVisibility(section.id, field.field_key)}
                      onRemove={() => onFieldRemove(section.id, field.field_key)}
                      onMoveUp={() => onFieldMove(section.id, field.field_key, "up")}
                      onMoveDown={() => onFieldMove(section.id, field.field_key, "down")}
                      isFirst={index === 0}
                      isLast={index === rightFields.length - 1}
                      swapDirection="left"
                    />
                  ))
                )}
              </div>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs h-7"
            onClick={() => onAddField(section.id)}
          >
            <Plus size={12} className="mr-1" />
            Add Field from Pool
          </Button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Field Card
// ---------------------------------------------------------------------------

function FieldCard({
  field,
  onSwapColumn,
  onToggleVisibility,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  swapDirection,
}: {
  field: FieldState;
  onSwapColumn: () => void;
  onToggleVisibility: () => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  swapDirection: "left" | "right";
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2 py-1.5 rounded-md border border-border/50 bg-muted/30 text-[12px]",
        !field.is_visible && "opacity-50"
      )}
    >
      <div className="flex flex-col shrink-0">
        <button
          onClick={onMoveUp}
          disabled={isFirst}
          className={cn(
            "p-0 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors leading-none",
            isFirst && "opacity-30 cursor-not-allowed"
          )}
          title="Move up"
        >
          <ChevronUp size={11} strokeWidth={1.5} />
        </button>
        <button
          onClick={onMoveDown}
          disabled={isLast}
          className={cn(
            "p-0 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors leading-none",
            isLast && "opacity-30 cursor-not-allowed"
          )}
          title="Move down"
        >
          <ChevronDown size={11} strokeWidth={1.5} />
        </button>
      </div>
      <span className="flex-1 truncate font-medium">{field.field_label}</span>
      <Badge
        variant="outline"
        className={cn("text-[9px] px-1 py-0 shrink-0 border", TYPE_COLORS[field.field_type] ?? "")}
      >
        {field.field_type}
      </Badge>
      <button
        onClick={onSwapColumn}
        className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        title={`Move to ${swapDirection} column`}
      >
        {swapDirection === "right" ? (
          <ArrowRight size={11} strokeWidth={1.5} />
        ) : (
          <ArrowLeft size={11} strokeWidth={1.5} />
        )}
      </button>
      <button
        onClick={onToggleVisibility}
        className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        title={field.is_visible ? "Hide" : "Show"}
      >
        {field.is_visible ? <Eye size={11} strokeWidth={1.5} /> : <EyeOff size={11} strokeWidth={1.5} />}
      </button>
      <button
        onClick={onRemove}
        className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
        title="Remove from section"
      >
        <X size={11} strokeWidth={1.5} />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function PageManagerView({
  pageType,
  pageTitle,
  pageDescription,
  initialSections,
  initialFields,
  availableFieldConfigs,
}: PageManagerViewProps) {
  const { toast } = useToast();

  // Build initial state: merge sections with their fields
  const [sections, setSections] = useState<SectionState[]>(() => {
    const fieldConfigMap = new Map(availableFieldConfigs.map((fc) => [fc.id, fc]));

    return initialSections.map((sec) => {
      const sectionFields = initialFields
        .filter((f) => f.section_id === sec.id)
        .map((f) => {
          const config = f.field_config_id ? fieldConfigMap.get(f.field_config_id) : null;
          return {
            id: f.id,
            field_config_id: f.field_config_id,
            field_key: f.field_key,
            field_label: config?.field_label ?? f.field_key,
            field_type: config?.field_type ?? "text",
            display_order: f.display_order,
            column_position: f.column_position,
            is_visible: f.is_visible,
          };
        })
        .sort((a, b) => a.display_order - b.display_order);

      return { ...sec, fields: sectionFields };
    });
  });

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [isDirty, setIsDirty] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [addFieldSectionId, setAddFieldSectionId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [fieldSearch, setFieldSearch] = useState("");

  // New section form state
  const [newSectionLabel, setNewSectionLabel] = useState("");
  const [newSectionIcon, setNewSectionIcon] = useState("file-text");
  const [newSectionSidebar, setNewSectionSidebar] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Split sections into main and sidebar
  const mainSections = useMemo(
    () => sections.filter((s) => !s.sidebar).sort((a, b) => a.display_order - b.display_order),
    [sections]
  );
  const sidebarSections = useMemo(
    () => sections.filter((s) => s.sidebar).sort((a, b) => a.display_order - b.display_order),
    [sections]
  );

  // All assigned field keys across all sections
  const assignedFieldKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const sec of sections) {
      for (const f of sec.fields) {
        keys.add(f.field_key);
      }
    }
    return keys;
  }, [sections]);

  // Available fields not yet assigned
  const unassignedFields = useMemo(() => {
    return availableFieldConfigs.filter((fc) => !assignedFieldKeys.has(fc.field_key));
  }, [availableFieldConfigs, assignedFieldKeys]);

  // Filtered unassigned fields for the add field dialog
  const filteredUnassignedFields = useMemo(() => {
    if (!fieldSearch.trim()) return unassignedFields;
    const q = fieldSearch.toLowerCase();
    return unassignedFields.filter(
      (f) =>
        f.field_label.toLowerCase().includes(q) ||
        f.field_key.toLowerCase().includes(q) ||
        f.module.toLowerCase().includes(q)
    );
  }, [unassignedFields, fieldSearch]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const toggleExpand = useCallback((sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  }, []);

  const toggleSectionVisibility = useCallback((sectionId: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, is_visible: !s.is_visible } : s))
    );
    setIsDirty(true);
  }, []);

  const handleSectionDragEnd = useCallback(
    (event: DragEndEvent, isSidebar: boolean) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      setSections((prev) => {
        const filtered = prev
          .filter((s) => s.sidebar === isSidebar)
          .sort((a, b) => a.display_order - b.display_order);

        const oldIdx = filtered.findIndex((s) => s.id === active.id);
        const newIdx = filtered.findIndex((s) => s.id === over.id);
        if (oldIdx === -1 || newIdx === -1) return prev;

        // Reorder
        const reordered = [...filtered];
        const [moved] = reordered.splice(oldIdx, 1);
        reordered.splice(newIdx, 0, moved);

        // Update display_order
        const updated = reordered.map((s, i) => ({ ...s, display_order: i }));

        // Merge back
        return prev.map((s) => {
          if (s.sidebar !== isSidebar) return s;
          const u = updated.find((x) => x.id === s.id);
          return u ?? s;
        });
      });
      setIsDirty(true);
    },
    []
  );

  const handleFieldSwapColumn = useCallback((sectionId: string, fieldKey: string) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        const field = s.fields.find((f) => f.field_key === fieldKey);
        if (!field) return s;
        const targetCol = field.column_position === "left" ? "right" : "left";
        const maxOrder = s.fields
          .filter((f) => f.column_position === targetCol)
          .reduce((max, f) => Math.max(max, f.display_order), -1);
        return {
          ...s,
          fields: s.fields.map((f) =>
            f.field_key === fieldKey
              ? { ...f, column_position: targetCol, display_order: maxOrder + 1 }
              : f
          ),
        };
      })
    );
    setIsDirty(true);
  }, []);

  const handleFieldMove = useCallback(
    (sectionId: string, fieldKey: string, direction: "up" | "down") => {
      setSections((prev) =>
        prev.map((s) => {
          if (s.id !== sectionId) return s;
          const field = s.fields.find((f) => f.field_key === fieldKey);
          if (!field) return s;
          const colFields = s.fields
            .filter((f) => f.column_position === field.column_position)
            .sort((a, b) => a.display_order - b.display_order);
          const idx = colFields.findIndex((f) => f.field_key === fieldKey);
          const swapIdx = direction === "up" ? idx - 1 : idx + 1;
          if (swapIdx < 0 || swapIdx >= colFields.length) return s;
          const thisOrder = colFields[idx].display_order;
          const swapOrder = colFields[swapIdx].display_order;
          const swapKey = colFields[swapIdx].field_key;
          return {
            ...s,
            fields: s.fields.map((f) => {
              if (f.field_key === fieldKey) return { ...f, display_order: swapOrder };
              if (f.field_key === swapKey) return { ...f, display_order: thisOrder };
              return f;
            }),
          };
        })
      );
      setIsDirty(true);
    },
    []
  );

  const handleFieldToggleVisibility = useCallback((sectionId: string, fieldKey: string) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        return {
          ...s,
          fields: s.fields.map((f) =>
            f.field_key === fieldKey ? { ...f, is_visible: !f.is_visible } : f
          ),
        };
      })
    );
    setIsDirty(true);
  }, []);

  const handleFieldRemove = useCallback((sectionId: string, fieldKey: string) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        return {
          ...s,
          fields: s.fields.filter((f) => f.field_key !== fieldKey),
        };
      })
    );
    setIsDirty(true);
  }, []);

  const handleAddFieldToSection = useCallback(
    (fieldConfig: FieldConfigInfo) => {
      if (!addFieldSectionId) return;

      setSections((prev) =>
        prev.map((s) => {
          if (s.id !== addFieldSectionId) return s;
          const maxOrder = s.fields.reduce((max, f) => Math.max(max, f.display_order), -1);
          return {
            ...s,
            fields: [
              ...s.fields,
              {
                field_config_id: fieldConfig.id,
                field_key: fieldConfig.field_key,
                field_label: fieldConfig.field_label,
                field_type: fieldConfig.field_type,
                display_order: maxOrder + 1,
                column_position: "left",
                is_visible: true,
              },
            ],
          };
        })
      );
      setIsDirty(true);
    },
    [addFieldSectionId]
  );

  const handleAddSection = useCallback(async () => {
    if (!newSectionLabel.trim()) return;

    const sectionKey = newSectionLabel
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

    const result = await addPageSection({
      page_type: pageType,
      section_key: sectionKey,
      section_label: newSectionLabel.trim(),
      section_icon: newSectionIcon,
      sidebar: newSectionSidebar,
    });

    if (result.error) {
      toast({ variant: "destructive", title: "Failed to add section", description: result.error });
      return;
    }

    if (result.data) {
      setSections((prev) => [...prev, { ...result.data!, fields: [] }]);
      toast({ title: "Section added", description: `"${newSectionLabel.trim()}" added successfully.` });
    }

    setNewSectionLabel("");
    setNewSectionIcon("file-text");
    setNewSectionSidebar(false);
    setAddSectionOpen(false);
  }, [newSectionLabel, newSectionIcon, newSectionSidebar, pageType, toast]);

  const handleDeleteSection = useCallback(async () => {
    if (!deleteConfirm) return;

    const result = await deletePageSection(deleteConfirm);
    if (result.error) {
      toast({ variant: "destructive", title: "Failed to delete section", description: result.error });
    } else {
      setSections((prev) => prev.filter((s) => s.id !== deleteConfirm));
      toast({ title: "Section deleted" });
    }
    setDeleteConfirm(null);
  }, [deleteConfirm, toast]);

  const handlePublish = useCallback(async () => {
    setIsPublishing(true);

    const sectionUpdates = sections.map((s) => ({
      id: s.id,
      section_key: s.section_key,
      section_label: s.section_label,
      section_icon: s.section_icon,
      display_order: s.display_order,
      is_visible: s.is_visible,
      is_locked: s.is_locked,
      visibility_rule: s.visibility_rule,
      sidebar: s.sidebar,
    }));

    const fieldAssignments = sections.flatMap((s) => {
      const left = s.fields
        .filter((f) => f.column_position === "left")
        .sort((a, b) => a.display_order - b.display_order);
      const right = s.fields
        .filter((f) => f.column_position === "right")
        .sort((a, b) => a.display_order - b.display_order);
      return [
        ...left.map((f, idx) => ({
          section_id: s.id,
          field_config_id: f.field_config_id,
          field_key: f.field_key,
          display_order: idx,
          column_position: f.column_position,
          is_visible: f.is_visible,
        })),
        ...right.map((f, idx) => ({
          section_id: s.id,
          field_config_id: f.field_config_id,
          field_key: f.field_key,
          display_order: idx,
          column_position: f.column_position,
          is_visible: f.is_visible,
        })),
      ];
    });

    const result = await publishPageLayout(pageType, sectionUpdates, fieldAssignments);

    if (result.error) {
      toast({ variant: "destructive", title: "Failed to publish", description: result.error });
    } else {
      toast({ title: "Layout published", description: "All changes have been saved." });
      setIsDirty(false);
    }

    setIsPublishing(false);
  }, [sections, pageType, toast]);

  // ---------------------------------------------------------------------------
  // Section column renderer
  // ---------------------------------------------------------------------------

  const renderSectionColumn = (columnSections: SectionState[], isSidebar: boolean) => (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={(e) => handleSectionDragEnd(e, isSidebar)}
    >
      <SortableContext
        items={columnSections.map((s) => s.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {columnSections.map((section) => (
            <SortableSectionCard
              key={section.id}
              section={section}
              isExpanded={expandedSections.has(section.id)}
              onToggleExpand={() => toggleExpand(section.id)}
              onToggleVisibility={() => toggleSectionVisibility(section.id)}
              onDeleteSection={() => setDeleteConfirm(section.id)}
              onFieldMove={handleFieldMove}
              onFieldSwapColumn={handleFieldSwapColumn}
              onFieldToggleVisibility={handleFieldToggleVisibility}
              onFieldRemove={handleFieldRemove}
              onAddField={(sectionId) => {
                setAddFieldSectionId(sectionId);
                setFieldSearch("");
              }}
              assignedFieldKeys={assignedFieldKeys}
              availableFieldConfigs={availableFieldConfigs}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const deletingSection = deleteConfirm
    ? sections.find((s) => s.id === deleteConfirm)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold">{pageTitle}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{pageDescription}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddSectionOpen(true)}
          >
            <Plus size={14} className="mr-1.5" />
            Add Section
          </Button>
          <Button
            size="sm"
            onClick={handlePublish}
            disabled={isPublishing || !isDirty}
            className="min-w-[120px]"
          >
            {isPublishing ? (
              <>
                <Loader2 size={14} className="mr-1.5 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                Publish Changes
                {isDirty && (
                  <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-white/80 inline-block" />
                )}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span>{mainSections.length} main sections</span>
        <span>{sidebarSections.length} sidebar sections</span>
        <span>
          {sections.reduce((sum, s) => sum + s.fields.length, 0)} total fields assigned
        </span>
        <span>{unassignedFields.length} fields available in pool</span>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-[1fr,320px] gap-6">
        {/* Main content sections */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Main Content
          </h2>
          {renderSectionColumn(mainSections, false)}
        </div>

        {/* Sidebar sections */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Sidebar
          </h2>
          {renderSectionColumn(sidebarSections, true)}
        </div>
      </div>

      {/* Add Section Dialog */}
      <Dialog open={addSectionOpen} onOpenChange={setAddSectionOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Add Section</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs">Section Label</Label>
              <Input
                placeholder="e.g. Additional Details"
                value={newSectionLabel}
                onChange={(e) => setNewSectionLabel(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Icon</Label>
              <Select value={newSectionIcon} onValueChange={setNewSectionIcon}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_ICONS.map((icon) => {
                    const IC = ICON_MAP[icon];
                    return (
                      <SelectItem key={icon} value={icon}>
                        <div className="flex items-center gap-2">
                          {IC && <IC size={14} />}
                          <span>{icon}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Sidebar Section</Label>
              <Switch
                checked={newSectionSidebar}
                onCheckedChange={setNewSectionSidebar}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAddSectionOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleAddSection} disabled={!newSectionLabel.trim()}>
              Add Section
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Field to Section Dialog */}
      <Dialog
        open={addFieldSectionId !== null}
        onOpenChange={(open) => {
          if (!open) setAddFieldSectionId(null);
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Field to Section</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={14}
              />
              <Input
                placeholder="Search available fields..."
                value={fieldSearch}
                onChange={(e) => setFieldSearch(e.target.value)}
                className="h-9 pl-8 text-sm"
              />
            </div>
            <ScrollArea className="h-[300px]">
              {filteredUnassignedFields.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">
                  {unassignedFields.length === 0
                    ? "All available fields are already assigned."
                    : "No fields match your search."}
                </p>
              ) : (
                <div className="space-y-1 pr-3">
                  {filteredUnassignedFields.map((fc) => (
                    <button
                      key={fc.id}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted text-left transition-colors"
                      onClick={() => handleAddFieldToSection(fc)}
                    >
                      <span className="text-[13px] font-medium flex-1 truncate">
                        {fc.field_label}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[9px] px-1 py-0 shrink-0 border",
                          TYPE_COLORS[fc.field_type] ?? ""
                        )}
                      >
                        {fc.field_type}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {fc.module}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddFieldSectionId(null)}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Section Confirmation */}
      <AlertDialog
        open={deleteConfirm !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirm(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Section</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingSection?.section_label}&quot;?
              All field assignments in this section will be removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSection}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
