// app/dashboard/page.tsx - Redirect to default home tab
import { redirect } from "next/navigation";

export default function DashboardPage() {
  // Redirect ke route baru dengan tab home
  redirect("/dashboard/home");
}
