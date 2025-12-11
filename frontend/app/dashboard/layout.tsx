import Link from "next/link"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies()
  const isAuthed = store.get("et3aa_auth")?.value === "authenticated"

  if (!isAuthed) {
    redirect("/login?redirect=/dashboard")
  }

  return <>{children}</>
}

