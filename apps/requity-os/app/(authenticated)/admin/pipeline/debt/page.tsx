import { redirect } from "next/navigation";

export default function DebtPipelineRedirect() {
  redirect("/admin/pipeline");
}
