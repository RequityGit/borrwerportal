"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { DocumentEditor } from "@/components/documents/editor/DocumentEditor";
import { LayoutEditor } from "@/components/documents/layout-editor/LayoutEditor";
import { saveTemplateContent } from "../../actions";
import type { StyledLayout } from "@/components/documents/styled-doc-parts/types";

interface Props {
  templateId: string;
  templateName: string;
  templateType: string;
  recordType: string;
  version: number;
  isActive: boolean;
  initialContent: string;
  mergeFields: Array<{
    key: string;
    label: string;
    source: string;
    column: string;
    format?: string | null;
  }>;
  styledLayout?: Record<string, unknown> | null;
}

export function TemplateEditorClient({
  templateId,
  templateName,
  templateType,
  recordType,
  version,
  isActive,
  initialContent,
  mergeFields,
  styledLayout,
}: Props) {
  const router = useRouter();
  const [editorMode, setEditorMode] = useState<"tiptap" | "layout">(
    styledLayout ? "layout" : "tiptap"
  );

  const handleSave = useCallback(
    async (content: string) => {
      const result = await saveTemplateContent(templateId, content);
      if (result.error) {
        toast.error(`Failed to save template: ${result.error}`);
      }
    },
    [templateId]
  );

  const goBack = () => router.push("/control-center/document-templates");

  if (editorMode === "layout") {
    return (
      <LayoutEditor
        template={{
          id: templateId,
          name: templateName,
          styled_layout: styledLayout as StyledLayout | null,
          merge_fields: mergeFields,
        }}
        onBack={goBack}
      />
    );
  }

  return (
    <DocumentEditor
      mode="template"
      templateId={templateId}
      initialContent={initialContent}
      mergeFields={mergeFields}
      documentInfo={{
        templateName,
        version,
        recordLabel: `${templateType} · ${recordType}`,
        status: isActive ? "Active" : "Inactive",
      }}
      onSave={handleSave}
      onClose={goBack}
    />
  );
}
