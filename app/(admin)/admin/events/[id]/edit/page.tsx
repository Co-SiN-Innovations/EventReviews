import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getEventById } from "@/lib/firebase/events"
import { Skeleton } from "@/components/ui/skeleton"
import EditEventForm from "@/components/edit-event-form"

// Loading component for the edit form
function EditEventFormLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-[300px] w-full" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      <Skeleton className="h-32 w-full" />
      <div className="flex justify-end space-x-2">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  )
}

// Edit event form container
async function EditEventFormContainer({ id }: { id: string }) {
  const event = await getEventById(id)

  if (!event) {
    notFound()
  }

  return <EditEventForm event={event} />
}

export default function EditEventPage({ params }: { params: { id: string } }) {
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Edit Event</h1>
      <Suspense fallback={<EditEventFormLoading />}>
        <EditEventFormContainer id={params.id} />
      </Suspense>
    </div>
  )
}

