"use client";

import { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  User,
  Building2,
  Target,
  Banknote,
  Home,
  TrendingUp,
  GripVertical,
  Plus,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Columns2,
  X,
  Search,
  Loader2,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useToast } from "@/components/ui/use-toast";
import {
  fetchPageLayout,
  savePageLayout,
  type PageObjectType,
  type FullLayout,
  type LayoutTab,
  type LayoutSection,
  type LayoutField,
} from "./actions";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const OBJECT_TYPES: {
  key: PageObjectType;
  label: string;
  icon: LucideIcon;
}[] = [
  { key: "contact", label: "Contact", icon: User },
  { key: "company", label: "Company", icon: Building2 },
  { key: "opportunity", label: "Opportunity", icon: Target },
  { key: "loan", label: "Loan", icon: Banknote },
  { key: "property", label: "Property", icon: Home },
  { key: "investment", label: "Investment", icon: TrendingUp },
];

const FIELD_TYPE_COLORS: Record<string, string> = {
  text: "bg-blue-500/10 text-blue-500",
  dropdown: "bg-purple-500/10 text-purple-500",
  currency: "bg-green-500/10 text-green-500",
  percentage: "bg-amber-500/10 text-amber-500",
  number: "bg-red-500/10 text-red-500",
  date: "bg-cyan-500/10 text-cyan-500",
  boolean: "bg-violet-500/10 text-violet-500",
  textarea: "bg-slate-500/10 text-slate-500",
  relationship: "bg-pink-500/10 text-pink-500",
  formula: "bg-orange-500/10 text-orange-500",
};

// ---------------------------------------------------------------------------
// Field Config type (from field_configurations table)
// ---------------------------------------------------------------------------

interface FieldConfig {
  id: string;
  module: string;
  field_key: string;
  field_label: string;
  field_type: string;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TypeBadge({ type }: { type: string }) {
  return (
    <span
      className={cn(
        "text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider whitespace-nowrap",
        FIELD_TYPE_COLORS[type] ?? "bg-muted text-muted-foreground"
      )}
    >
      {type}
    </span>
  );
}

function ColumnLayoutPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const opts = ["1-col", "2-col", "3-col"];
  return (
    <div className="flex gap-0.5 bg-muted rounded-md p-0.5">
      {opts.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={cn(
            "px-2 py-1 text-[11px] font-medium rounded transition-colors",
            value === o
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Field Row
// ---------------------------------------------------------------------------

function FieldRow({
  field,
  isFirst,
  isLast,
  colCount,
  onMoveUp,
  onMoveDown,
  onToggleCol,
  onRemove,
}: {
  field: LayoutField;
  isFirst: boolean;
  isLast: boolean;
  colCount: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleCol: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="group flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors">
      <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
      <span className="text-xs font-mono text-muted-foreground min-w-[100px] truncate">
        {field.field_key}
      </span>
      <span className="text-xs text-foreground flex-1 truncate">
        {field.label_override ?? field.field_key}
      </span>
      {field.span > 1 && (
        <span className="text-[10px] font-medium text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded">
          FULL
        </span>
      )}
      {field.display_format && <TypeBadge type={field.display_format} />}
      <span className="text-[10px] text-muted-foreground font-medium w-5 text-center font-mono">
        C{field.column_position}
      </span>
      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          disabled={isFirst}
          onClick={onMoveUp}
        >
          <ArrowUp className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          disabled={isLast}
          onClick={onMoveDown}
        >
          <ArrowDown className="h-3 w-3" />
        </Button>
        {colCount > 1 && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onToggleCol}
          >
            <Columns2 className="h-3 w-3" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-destructive hover:text-destructive"
          onClick={onRemove}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section Editor (inline)
// ---------------------------------------------------------------------------

function SectionEditor({
  section,
  tabs,
  onUpdate,
  onClose,
}: {
  section: LayoutSection;
  tabs: LayoutTab[];
  onUpdate: (s: LayoutSection) => void;
  onClose: () => void;
}) {
  return (
    <div className="bg-muted/30 border border-border rounded-lg p-4 mt-2 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold">Edit Section</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-[11px]">Title</Label>
          <Input
            value={section.title}
            onChange={(e) => onUpdate({ ...section, title: e.target.value })}
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px]">Icon (Lucide name)</Label>
          <Input
            value={section.icon ?? ""}
            onChange={(e) =>
              onUpdate({ ...section, icon: e.target.value || null })
            }
            className="h-8 text-xs font-mono"
            placeholder="e.g. user, building-2"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px]">Column Layout</Label>
          <ColumnLayoutPicker
            value={section.column_layout}
            onChange={(v) => onUpdate({ ...section, column_layout: v })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px]">Tab Group</Label>
          <Select
            value={section.tab_group ?? "__none__"}
            onValueChange={(v) =>
              onUpdate({ ...section, tab_group: v === "__none__" ? null : v })
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select tab..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">No tab</SelectItem>
              {tabs.map((tab) => (
                <SelectItem key={tab.tab_key} value={tab.tab_key}>
                  {tab.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[11px]">Span</Label>
          <Select
            value={section.span}
            onValueChange={(v) => onUpdate({ ...section, span: v })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full">Full width</SelectItem>
              <SelectItem value="half">Half width</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end gap-4 pb-1">
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <Switch
              checked={section.is_collapsible}
              onCheckedChange={(v) =>
                onUpdate({ ...section, is_collapsible: v })
              }
              className="scale-75"
            />
            Collapsible
          </label>
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <Switch
              checked={section.is_collapsed_default}
              onCheckedChange={(v) =>
                onUpdate({ ...section, is_collapsed_default: v })
              }
              className="scale-75"
            />
            Collapsed default
          </label>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section Card
// ---------------------------------------------------------------------------

function SectionCard({
  section,
  index,
  total,
  tabs,
  availableFields,
  onMoveUp,
  onMoveDown,
  onUpdate,
  onHide,
  onDelete,
  onFieldsUpdate,
  onAddField,
}: {
  section: LayoutSection;
  index: number;
  total: number;
  tabs: LayoutTab[];
  availableFields: FieldConfig[];
  onMoveUp: () => void;
  onMoveDown: () => void;
  onUpdate: (s: LayoutSection) => void;
  onHide: () => void;
  onDelete: () => void;
  onFieldsUpdate: (fields: LayoutField[]) => void;
  onAddField: (fieldKey: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showAddField, setShowAddField] = useState(false);
  const [addFieldSearch, setAddFieldSearch] = useState("");
  const colCount = parseInt(section.column_layout) || 2;

  const moveField = (fIdx: number, dir: number) => {
    const fields = [...section.fields];
    const [item] = fields.splice(fIdx, 1);
    fields.splice(fIdx + dir, 0, item);
    // Normalize sort_order to match new array positions
    const normalized = fields.map((f, i) => ({ ...f, sort_order: i }));
    onFieldsUpdate(normalized);
  };

  const toggleCol = (fIdx: number) => {
    const fields = [...section.fields];
    fields[fIdx] = {
      ...fields[fIdx],
      column_position:
        fields[fIdx].column_position >= colCount
          ? 1
          : fields[fIdx].column_position + 1,
    };
    onFieldsUpdate(fields);
  };

  const removeField = (fIdx: number) => {
    onFieldsUpdate(section.fields.filter((_, i) => i !== fIdx));
  };

  const filteredAvailable = availableFields.filter(
    (f) =>
      !section.fields.some((sf) => sf.field_key === f.field_key) &&
      (addFieldSearch === "" ||
        f.field_key.toLowerCase().includes(addFieldSearch.toLowerCase()) ||
        f.field_label.toLowerCase().includes(addFieldSearch.toLowerCase()))
  );

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden hover:border-border/80 transition-colors">
      {/* Header */}
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2.5",
          expanded && "border-b border-border"
        )}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground/40 cursor-grab shrink-0" />
        <span className="text-[11px] font-bold text-muted-foreground w-5 text-center font-mono">
          {index + 1}
        </span>
        <span className="text-[13px] font-semibold text-foreground flex-1 truncate">
          {section.title}
        </span>
        <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
          {section.column_layout}
        </span>
        <span className="text-[10px] font-medium text-muted-foreground font-mono">
          {section.fields.length} fields
        </span>
        {section.tab_group && (
          <Badge variant="outline" className="text-[10px] h-5">
            {section.tab_group}
          </Badge>
        )}
        <div className="flex gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={index === 0}
            onClick={onMoveUp}
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={index === total - 1}
            onClick={onMoveDown}
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-7 w-7", editing && "bg-accent")}
            onClick={() => setEditing(!editing)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onHide}
          >
            <EyeOff className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Inline editor */}
      {editing && (
        <div className="px-3">
          <SectionEditor
            section={section}
            tabs={tabs}
            onUpdate={onUpdate}
            onClose={() => setEditing(false)}
          />
        </div>
      )}

      {/* Fields */}
      {expanded && (
        <div className="px-2 py-1.5 space-y-0.5">
          {section.fields.map((field, fIdx) => (
            <FieldRow
              key={field.field_key}
              field={field}
              isFirst={fIdx === 0}
              isLast={fIdx === section.fields.length - 1}
              colCount={colCount}
              onMoveUp={() => moveField(fIdx, -1)}
              onMoveDown={() => moveField(fIdx, 1)}
              onToggleCol={() => toggleCol(fIdx)}
              onRemove={() => removeField(fIdx)}
            />
          ))}

          {/* Add Field */}
          {showAddField ? (
            <div className="border border-dashed border-border rounded-md p-2 mt-1 space-y-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  value={addFieldSearch}
                  onChange={(e) => setAddFieldSearch(e.target.value)}
                  placeholder="Search fields..."
                  className="h-7 pl-7 text-xs"
                  autoFocus
                />
              </div>
              <div className="max-h-32 overflow-y-auto space-y-0.5">
                {filteredAvailable.length > 0 ? (
                  filteredAvailable.map((f) => (
                    <button
                      key={f.field_key}
                      className="flex items-center gap-2 w-full px-2 py-1 rounded text-xs hover:bg-muted transition-colors text-left"
                      onClick={() => {
                        onAddField(f.field_key);
                        setAddFieldSearch("");
                        setShowAddField(false);
                      }}
                    >
                      <span className="font-mono text-muted-foreground truncate">
                        {f.field_key}
                      </span>
                      <span className="flex-1 truncate">{f.field_label}</span>
                      <TypeBadge type={f.field_type} />
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    No available fields
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-6 text-xs"
                onClick={() => {
                  setShowAddField(false);
                  setAddFieldSearch("");
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <button
              className="w-full border border-dashed border-border rounded-md py-1.5 text-xs font-medium text-muted-foreground hover:border-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1 mt-1"
              onClick={() => setShowAddField(true)}
            >
              <Plus className="h-3 w-3" /> Add Field
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add Section Dialog
// ---------------------------------------------------------------------------

function AddSectionDialog({
  open,
  onClose,
  onAdd,
  tabs,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (section: LayoutSection) => void;
  tabs: LayoutTab[];
}) {
  const [title, setTitle] = useState("");
  const [sectionKey, setSectionKey] = useState("");
  const [icon, setIcon] = useState("");
  const [columnLayout, setColumnLayout] = useState("2-col");
  const [tabGroup, setTabGroup] = useState<string | null>(null);

  const handleAdd = () => {
    if (!title.trim()) return;
    const key =
      sectionKey.trim() ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_|_$/g, "");
    onAdd({
      section_key: key,
      title: title.trim(),
      subtitle: null,
      icon: icon.trim() || null,
      column_layout: columnLayout,
      sort_order: 0,
      is_collapsible: true,
      is_collapsed_default: false,
      is_visible: true,
      tab_group: tabGroup,
      span: "full",
      fields: [],
    });
    setTitle("");
    setSectionKey("");
    setIcon("");
    setColumnLayout("2-col");
    setTabGroup(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">Add Section</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Title</Label>
            <Input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!sectionKey) {
                  // auto-generate key from title
                }
              }}
              className="h-8 text-sm"
              placeholder="e.g. Contact Information"
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Section Key</Label>
            <Input
              value={
                sectionKey ||
                title
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "_")
                  .replace(/^_|_$/g, "")
              }
              onChange={(e) => setSectionKey(e.target.value)}
              className="h-8 text-sm font-mono"
              placeholder="auto-generated from title"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Icon</Label>
              <Input
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="h-8 text-sm font-mono"
                placeholder="e.g. user"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tab Group</Label>
              <Select
                value={tabGroup ?? "__none__"}
                onValueChange={(v) => setTabGroup(v === "__none__" ? null : v)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select tab..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No tab</SelectItem>
                  {tabs.map((tab) => (
                    <SelectItem key={tab.tab_key} value={tab.tab_key}>
                      {tab.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Column Layout</Label>
            <ColumnLayoutPicker value={columnLayout} onChange={setColumnLayout} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleAdd} disabled={!title.trim()}>
            Add Section
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Add Tab Dialog
// ---------------------------------------------------------------------------

function AddTabDialog({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (tab: LayoutTab) => void;
}) {
  const [title, setTitle] = useState("");
  const [tabKey, setTabKey] = useState("");
  const [icon, setIcon] = useState("");

  const handleAdd = () => {
    if (!title.trim()) return;
    const key =
      tabKey.trim() ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_|_$/g, "");
    onAdd({
      tab_key: key,
      title: title.trim(),
      icon: icon.trim() || null,
      sort_order: 0,
      is_visible: true,
      badge_field: null,
    });
    setTitle("");
    setTabKey("");
    setIcon("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">Add Tab</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-8 text-sm"
              placeholder="e.g. Overview"
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Tab Key</Label>
            <Input
              value={
                tabKey ||
                title
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "_")
                  .replace(/^_|_$/g, "")
              }
              onChange={(e) => setTabKey(e.target.value)}
              className="h-8 text-sm font-mono"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Icon (Lucide name)</Label>
            <Input
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="h-8 text-sm font-mono"
              placeholder="e.g. layout-dashboard"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleAdd} disabled={!title.trim()}>
            Add Tab
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface PageLayoutManagerViewProps {
  initialLayouts: { id: string; object_type: string; name: string }[];
  fieldConfigs: FieldConfig[];
}

export function PageLayoutManagerView({
  initialLayouts,
  fieldConfigs,
}: PageLayoutManagerViewProps) {
  const { toast } = useToast();

  const [selectedObject, setSelectedObject] = useState<PageObjectType>("contact");
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [layout, setLayout] = useState<FullLayout | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);
  const [showAddTab, setShowAddTab] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "section" | "tab";
    index: number;
  } | null>(null);

  // Section counts from initial data
  const layoutMap = new Map(
    initialLayouts.map((l) => [l.object_type, l])
  );

  // ---------------------------------------------------------------------------
  // Load layout for selected object type
  // ---------------------------------------------------------------------------

  const loadLayout = useCallback(
    async (objectType: PageObjectType) => {
      setLoading(true);
      try {
        const result = await fetchPageLayout(objectType);
        if (result.error) {
          toast({
            variant: "destructive",
            title: "Failed to load layout",
            description: result.error,
          });
          setLayout(null);
        } else if (result.data) {
          setLayout(result.data);
          // Set active tab to first tab or null
          if (result.data.tabs.length > 0) {
            setActiveTab(result.data.tabs[0].tab_key);
          } else {
            setActiveTab(null);
          }
        } else {
          // No layout exists yet — create empty
          setLayout({
            id: "",
            object_type: objectType,
            name: `${objectType.charAt(0).toUpperCase() + objectType.slice(1)} Detail — Default`,
            description: null,
            tabs: [],
            sections: [],
          });
          setActiveTab(null);
        }
      } finally {
        setLoading(false);
        setHasChanges(false);
      }
    },
    [toast]
  );

  const handleObjectSelect = useCallback(
    (key: PageObjectType) => {
      setSelectedObject(key);
      loadLayout(key);
    },
    [loadLayout]
  );

  // Load initial layout
  useEffect(() => {
    loadLayout("contact");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // Save
  // ---------------------------------------------------------------------------

  const handleSave = async () => {
    if (!layout || !hasChanges) return;
    setSaving(true);
    try {
      // Normalize sort_order values to match array positions before saving
      const normalizedSections = layout.sections.map((s, si) => ({
        ...s,
        sort_order: si,
        fields: s.fields.map((f, fi) => ({
          ...f,
          sort_order: fi,
        })),
      }));

      const result = await savePageLayout(
        layout.object_type,
        layout.name,
        layout.tabs,
        normalizedSections
      );
      if (result.error) {
        toast({
          variant: "destructive",
          title: "Failed to save layout",
          description: result.error,
        });
      } else {
        toast({ title: "Layout saved", description: `${layout.name} updated.` });
        setHasChanges(false);
        // Reload to get fresh IDs from database
        await loadLayout(layout.object_type);
      }
    } catch (err) {
      console.error("handleSave unexpected error:", err);
      toast({
        variant: "destructive",
        title: "Failed to save layout",
        description:
          err instanceof Error ? err.message : "An unexpected error occurred",
      });
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  const currentSections = layout?.sections ?? [];
  const currentTabs = layout?.tabs ?? [];

  // Filter sections by active tab
  const visibleSections =
    activeTab !== null
      ? currentSections.filter((s) => s.tab_group === activeTab)
      : currentSections.filter((s) => !s.tab_group);

  const hiddenSections = currentSections.filter((s) => !s.is_visible);

  // Get unassigned fields for current object type
  const assignedFieldKeys = new Set(
    currentSections.flatMap((s) => s.fields.map((f) => f.field_key))
  );

  // Map object types to field_configuration modules
  const moduleForObject: Record<string, string[]> = {
    contact: ["contact", "crm"],
    company: ["company", "crm"],
    opportunity: ["opportunity", "deal", "pipeline"],
    loan: ["loan", "deal", "pipeline"],
    property: ["property"],
    investment: ["investment", "investor"],
    borrower_profile: ["borrower"],
    investor_profile: ["investor"],
  };

  const relevantModules = moduleForObject[selectedObject] ?? [selectedObject];
  const relevantFields = fieldConfigs.filter((f) =>
    relevantModules.some(
      (m) => f.module.toLowerCase().includes(m) || m.includes(f.module.toLowerCase())
    )
  );
  const unassignedFields = relevantFields.filter(
    (f) => !assignedFieldKeys.has(f.field_key)
  );

  const updateLayout = (updates: Partial<FullLayout>) => {
    if (!layout) return;
    setLayout({ ...layout, ...updates });
    setHasChanges(true);
  };

  const moveSection = (idx: number, dir: number) => {
    // Find the section in the full sections array
    const section = visibleSections[idx];
    const fullIdx = currentSections.indexOf(section);
    const targetSection = visibleSections[idx + dir];
    const targetFullIdx = currentSections.indexOf(targetSection);

    const arr = [...currentSections];
    arr[fullIdx] = targetSection;
    arr[targetFullIdx] = section;
    updateLayout({ sections: arr });
  };

  const updateSection = (sectionKey: string, updated: LayoutSection) => {
    updateLayout({
      sections: currentSections.map((s) =>
        s.section_key === sectionKey ? updated : s
      ),
    });
  };

  const updateSectionFields = (sectionKey: string, fields: LayoutField[]) => {
    updateLayout({
      sections: currentSections.map((s) =>
        s.section_key === sectionKey ? { ...s, fields } : s
      ),
    });
  };

  const hideSection = (sectionKey: string) => {
    updateLayout({
      sections: currentSections.map((s) =>
        s.section_key === sectionKey ? { ...s, is_visible: false } : s
      ),
    });
  };

  const restoreSection = (sectionKey: string) => {
    updateLayout({
      sections: currentSections.map((s) =>
        s.section_key === sectionKey ? { ...s, is_visible: true } : s
      ),
    });
  };

  const deleteSection = (idx: number) => {
    const section = visibleSections[idx];
    updateLayout({
      sections: currentSections.filter((s) => s.section_key !== section.section_key),
    });
    setDeleteTarget(null);
  };

  const addSection = (section: LayoutSection) => {
    const newSection = {
      ...section,
      tab_group: activeTab,
      sort_order: currentSections.length,
    };
    updateLayout({ sections: [...currentSections, newSection] });
  };

  const addFieldToSection = (sectionKey: string, fieldKey: string) => {
    const fieldConfig = fieldConfigs.find((f) => f.field_key === fieldKey);
    const section = currentSections.find((s) => s.section_key === sectionKey);
    if (!section) return;

    const newField: LayoutField = {
      field_key: fieldKey,
      label_override: fieldConfig?.field_label ?? null,
      column_position: 1,
      sort_order: section.fields.length,
      is_visible: true,
      is_read_only: false,
      span: 1,
      display_format: fieldConfig?.field_type ?? null,
      placeholder: null,
      help_text: null,
    };
    updateSectionFields(sectionKey, [...section.fields, newField]);
  };

  // Tab mutations
  const moveTab = (idx: number, dir: number) => {
    const arr = [...currentTabs];
    const [item] = arr.splice(idx, 1);
    arr.splice(idx + dir, 0, item);
    updateLayout({ tabs: arr });
  };

  const addTab = (tab: LayoutTab) => {
    updateLayout({ tabs: [...currentTabs, { ...tab, sort_order: currentTabs.length }] });
  };

  const deleteTab = (idx: number) => {
    const tab = currentTabs[idx];
    // Also unset tab_group on sections that reference this tab
    updateLayout({
      tabs: currentTabs.filter((_, i) => i !== idx),
      sections: currentSections.map((s) =>
        s.tab_group === tab.tab_key ? { ...s, tab_group: null } : s
      ),
    });
    if (activeTab === tab.tab_key) {
      setActiveTab(currentTabs.length > 1 ? currentTabs[0].tab_key : null);
    }
    setDeleteTarget(null);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="-m-6 lg:-m-8 flex h-[calc(100vh-64px)]">
      {/* Left Panel — Object Types */}
      <aside className="w-[220px] shrink-0 border-r border-border bg-background flex flex-col">
        <div className="px-4 pt-5 pb-3 border-b border-border">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">
            Object Types
          </p>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {OBJECT_TYPES.map((obj) => {
              const hasLayout = layoutMap.has(obj.key);
              return (
                <Button
                  key={obj.key}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-2.5 h-auto py-2.5 px-3 text-[13px] font-medium",
                    selectedObject === obj.key &&
                      "bg-accent text-accent-foreground"
                  )}
                  onClick={() => handleObjectSelect(obj.key)}
                >
                  <obj.icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                  <span className="flex-1 text-left truncate">{obj.label}</span>
                  {hasLayout && (
                    <span className="text-[10px] font-semibold text-muted-foreground font-mono">
                      <Eye className="h-3 w-3" />
                    </span>
                  )}
                </Button>
              );
            })}
          </div>
        </ScrollArea>
      </aside>

      {/* Right Panel — Layout Editor */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading layout...</p>
            </div>
          </div>
        ) : (
          <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-lg font-semibold tracking-tight">
                  {layout?.name ?? "No Layout"}
                </h1>
                <p className="text-[13px] text-muted-foreground mt-0.5">
                  Configure sections, fields, and tabs for the{" "}
                  {selectedObject} detail page.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {hasChanges && (
                  <span className="text-[11px] text-amber-500 font-medium">
                    Unsaved changes
                  </span>
                )}
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges || saving}
                  size="sm"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                  Save Changes
                </Button>
              </div>
            </div>

            {/* Tabs Editor */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">
                Tabs
              </p>
              <div className="flex gap-1 p-1 bg-muted/50 rounded-lg border border-border overflow-x-auto items-center">
                {currentTabs.map((tab, idx) => (
                  <div key={tab.tab_key} className="flex items-center gap-1 group">
                    <button
                      onClick={() => setActiveTab(tab.tab_key)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors whitespace-nowrap",
                        activeTab === tab.tab_key
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <GripVertical className="h-3 w-3 text-muted-foreground/40" />
                      {tab.title}
                    </button>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        disabled={idx === 0}
                        onClick={() => moveTab(idx, -1)}
                      >
                        <ArrowUp className="h-2.5 w-2.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        disabled={idx === currentTabs.length - 1}
                        onClick={() => moveTab(idx, 1)}
                      >
                        <ArrowDown className="h-2.5 w-2.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-destructive hover:text-destructive"
                        onClick={() =>
                          setDeleteTarget({ type: "tab", index: idx })
                        }
                      >
                        <X className="h-2.5 w-2.5" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground ml-1"
                  onClick={() => setShowAddTab(true)}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Tab
                </Button>
              </div>
            </div>

            {/* Sections Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">
                  Sections
                </p>
                <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  {visibleSections.filter((s) => s.is_visible).length} sections
                  {" · "}
                  {visibleSections
                    .filter((s) => s.is_visible)
                    .reduce((acc, s) => acc + s.fields.length, 0)}{" "}
                  fields
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddSection(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Section
              </Button>
            </div>

            {/* Section Cards */}
            <div className="space-y-2">
              {visibleSections.filter((s) => s.is_visible).length > 0 ? (
                visibleSections
                  .filter((s) => s.is_visible)
                  .map((section, idx) => (
                    <SectionCard
                      key={section.section_key}
                      section={section}
                      index={idx}
                      total={visibleSections.filter((s) => s.is_visible).length}
                      tabs={currentTabs}
                      availableFields={unassignedFields}
                      onMoveUp={() => moveSection(idx, -1)}
                      onMoveDown={() => moveSection(idx, 1)}
                      onUpdate={(updated) =>
                        updateSection(section.section_key, updated)
                      }
                      onHide={() => hideSection(section.section_key)}
                      onDelete={() =>
                        setDeleteTarget({ type: "section", index: idx })
                      }
                      onFieldsUpdate={(fields) =>
                        updateSectionFields(section.section_key, fields)
                      }
                      onAddField={(fieldKey) =>
                        addFieldToSection(section.section_key, fieldKey)
                      }
                    />
                  ))
              ) : (
                <div className="text-center py-12 bg-card border border-border rounded-lg">
                  <LayoutDashboard className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-sm font-semibold mb-1">
                    No sections configured
                  </p>
                  <p className="text-[13px] text-muted-foreground mb-4">
                    Add sections to organize fields on this{" "}
                    {activeTab ? "tab" : "page"}.
                  </p>
                  <Button onClick={() => setShowAddSection(true)}>
                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Add First Section
                  </Button>
                </div>
              )}
            </div>

            {/* Unassigned Fields */}
            {unassignedFields.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">
                    Unassigned Fields
                  </p>
                  <span className="text-[11px] font-medium text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                    {unassignedFields.length} fields not on page
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 p-3 bg-card border border-dashed border-border rounded-lg">
                  {unassignedFields.map((f) => (
                    <div
                      key={f.field_key}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-muted rounded-md text-xs cursor-default"
                    >
                      <span className="font-mono text-muted-foreground">
                        {f.field_key}
                      </span>
                      <TypeBadge type={f.field_type} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hidden Sections */}
            {hiddenSections.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">
                  Hidden Sections
                </p>
                <div className="space-y-1">
                  {hiddenSections.map((section) => (
                    <div
                      key={section.section_key}
                      className="flex items-center gap-3 px-3 py-2 bg-card border border-border rounded-lg"
                    >
                      <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground flex-1">
                        {section.title}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {section.fields.length} fields
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => restoreSection(section.section_key)}
                      >
                        <Eye className="h-3 w-3 mr-1" /> Restore
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <AddSectionDialog
        open={showAddSection}
        onClose={() => setShowAddSection(false)}
        onAdd={addSection}
        tabs={currentTabs}
      />

      <AddTabDialog
        open={showAddTab}
        onClose={() => setShowAddTab(false)}
        onAdd={addTab}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm">
              Delete {deleteTarget?.type === "section" ? "section" : "tab"}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              {deleteTarget?.type === "section"
                ? "This will remove the section and all its field assignments. Fields will become unassigned."
                : "This will remove the tab. Sections assigned to this tab will become unassigned."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!deleteTarget) return;
                if (deleteTarget.type === "section") {
                  deleteSection(deleteTarget.index);
                } else {
                  deleteTab(deleteTarget.index);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
