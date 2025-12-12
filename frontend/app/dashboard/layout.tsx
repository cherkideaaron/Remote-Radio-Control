import { cookies } from "next/headers"
import { redirect } from "next/navigation"

// Force dynamic rendering - no caching
export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies()
  const authCookie = store.get("et3aa_auth")
  
  // Strict check - cookie must exist and have exact value
  if (!authCookie || authCookie.value !== "authenticated") {
    redirect("/login?redirect=/dashboard")
  }

  return <>{children}</>
}

