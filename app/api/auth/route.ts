import { type NextRequest, NextResponse } from "next/server"
import { registerUser, signIn, resetPassword } from "@/lib/firebase/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, email, password, name } = body

    let result

    switch (action) {
      case "register":
        if (!email || !password || !name) {
          return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
        }
        result = await registerUser(email, password, name)
        break

      case "login":
        if (!email || !password) {
          return NextResponse.json({ success: false, error: "Missing email or password" }, { status: 400 })
        }
        result = await signIn(email, password)
        break

      case "reset-password":
        if (!email) {
          return NextResponse.json({ success: false, error: "Missing email" }, { status: 400 })
        }
        result = await resetPassword(email)
        break

      default:
        return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Auth API error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "An unexpected error occurred" },
      { status: 500 },
    )
  }
}

