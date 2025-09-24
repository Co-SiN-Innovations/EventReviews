import type React from "react"
import type { Metadata } from "next"
import AdminLayoutClient from "./AdminLayoutClient"
import ActivityTracker from "@/components/activity-tracker"

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Admin dashboard for the event management platform",
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <AdminLayoutClient children={children} />
      <ActivityTracker />
    </>
  )
}

