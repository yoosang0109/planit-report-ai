import { redirect } from "next/navigation";

// /login is a placeholder. Auth can be added later.
// For MVP, redirect directly to the app.
export default function LoginPage() {
  redirect("/students");
}
