"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { DocumentEditor } from "@/components/documents/editor/DocumentEditor";
import { createClient } from "@/lib/supabase/client";

interface Props {
  documentId: string;
  fileName: string;
  status: string;
  initialContent?: string;
  mergeData: Record<string, string>;
  templateName: string;
  templateVersion: number;
  recordType: string;
  recordId: string;
  mergeFields: Array<{
    key: string;
    label: string;
    source: string;
    column: string;
    format?: string | null;
  }>;
  generatedBy: string;
  generatedAt: string;
}

export function EditorPageClient({
  documentId,
  fileName,
  status,
  initialContent,
  mergeData,
  templateName,
  templateVersion,
  recordType,
  recordId,
  mergeFields,
  generatedBy,
  generatedAt,
}: Props) {
  const router = useRouter();

  const handleSave = useCallback(async (content: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("generated_documents")
      .update({ content })
      .eq("id", documentId);
    if (error) {
      console.error("Failed to save document:", error);
    }
  }, [documentId]);

  return (
    <DocumentEditor
      mode="document"
      documentId={documentId}
      initialContent={initialContent}
      mergeFields={mergeFields}
      mergeData={mergeData}
      onSave={handleSave}
      documentInfo={{
        templateName,
        version: templateVersion,
        recordLabel: `${recordType} ${recordId.slice(0, 8)}...`,
        generatedBy,
        generatedAt,
        status,
      }}
      onClose={() => router.push("/admin/documents")}
    />
  );
}
