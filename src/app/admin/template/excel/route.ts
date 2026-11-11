import { redirect } from "next/navigation";

export function GET() {
  redirect("/admin/template/google-sheet");
}
