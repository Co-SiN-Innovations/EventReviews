"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function FirebaseSetupPage() {
  const router = useRouter()
  const [config, setConfig] = useState({
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
    measurementId: "",
  })
  const [jsonConfig, setJsonConfig] = useState("")
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setConfig((prev) => ({ ...prev, [name]: value }))
  }

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonConfig(e.target.value)
  }

  const parseJsonConfig = () => {
    try {
      const parsed = JSON.parse(jsonConfig)
      setConfig({
        apiKey: parsed.apiKey || "",
        authDomain: parsed.authDomain || "",
        projectId: parsed.projectId || "",
        storageBucket: parsed.storageBucket || "",
        messagingSenderId: parsed.messagingSenderId || "",
        appId: parsed.appId || "",
        measurementId: parsed.measurementId || "",
      })
      setMessage("Firebase configuration parsed successfully!")
      setStatus("success")
    } catch (error) {
      setMessage("Invalid JSON format. Please check your input.")
      setStatus("error")
    }
  }

  const saveConfig = async () => {
    try {
      // In a real application, you would save this to a .env file or similar
      // For this demo, we'll just show a success message

      // Validate that all required fields are filled
      const requiredFields = ["apiKey", "authDomain", "projectId", "storageBucket", "messagingSenderId", "appId"]
      const missingFields = requiredFields.filter((field) => !config[field as keyof typeof config])

      if (missingFields.length > 0) {
        setMessage(`Please fill in all required fields: ${missingFields.join(", ")}`)
        setStatus("error")
        return
      }

      // In a real app, this would update your configuration files or environment variables
      localStorage.setItem("firebaseConfig", JSON.stringify(config))

      setMessage("Firebase configuration saved successfully! Please update your configuration files with these values.")
      setStatus("success")

      // In a real application, you might redirect to another page or reload
      // router.push("/")
    } catch (error) {
      setMessage("Error saving configuration: " + (error instanceof Error ? error.message : String(error)))
      setStatus("error")
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Firebase Configuration Setup</CardTitle>
          <CardDescription>
            Enter your Firebase configuration details to connect your application to Firebase.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {status !== "idle" && (
            <Alert variant={status === "success" ? "default" : "destructive"}>
              {status === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertTitle>{status === "success" ? "Success" : "Error"}</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="jsonConfig">Paste Firebase Config JSON (optional)</Label>
              <Textarea
                id="jsonConfig"
                placeholder='{"apiKey": "...", "authDomain": "..."}'
                value={jsonConfig}
                onChange={handleJsonChange}
                className="h-32"
              />
              <Button variant="outline" className="mt-2" onClick={parseJsonConfig} disabled={!jsonConfig}>
                Parse JSON
              </Button>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  name="apiKey"
                  value={config.apiKey}
                  onChange={handleChange}
                  placeholder="AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="authDomain">Auth Domain</Label>
                <Input
                  id="authDomain"
                  name="authDomain"
                  value={config.authDomain}
                  onChange={handleChange}
                  placeholder="your-project.firebaseapp.com"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="projectId">Project ID</Label>
                <Input
                  id="projectId"
                  name="projectId"
                  value={config.projectId}
                  onChange={handleChange}
                  placeholder="your-project"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="storageBucket">Storage Bucket</Label>
                <Input
                  id="storageBucket"
                  name="storageBucket"
                  value={config.storageBucket}
                  onChange={handleChange}
                  placeholder="your-project.appspot.com"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="messagingSenderId">Messaging Sender ID</Label>
                <Input
                  id="messagingSenderId"
                  name="messagingSenderId"
                  value={config.messagingSenderId}
                  onChange={handleChange}
                  placeholder="123456789012"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="appId">App ID</Label>
                <Input
                  id="appId"
                  name="appId"
                  value={config.appId}
                  onChange={handleChange}
                  placeholder="1:123456789012:web:a1b2c3d4e5f6g7h8i9j0"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="measurementId">Measurement ID (optional)</Label>
                <Input
                  id="measurementId"
                  name="measurementId"
                  value={config.measurementId}
                  onChange={handleChange}
                  placeholder="G-ABCDEFGHIJ"
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={saveConfig} className="w-full">
            Save Configuration
          </Button>
        </CardFooter>
      </Card>

      {status === "success" && (
        <Card className="max-w-2xl mx-auto mt-6">
          <CardHeader>
            <CardTitle>Update Your Configuration Files</CardTitle>
            <CardDescription>Copy and paste the following code into your Firebase configuration files.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Configuration Object</Label>
              <div className="bg-muted p-4 rounded-md overflow-x-auto mt-2">
                <pre className="text-sm">
                  {`const firebaseConfig = {
  apiKey: "${config.apiKey}",
  authDomain: "${config.authDomain}",
  projectId: "${config.projectId}",
  storageBucket: "${config.storageBucket}",
  messagingSenderId: "${config.messagingSenderId}",
  appId: "${config.appId}",${
    config.measurementId
      ? `
  measurementId: "${config.measurementId}",`
      : ""
  }
}`}
                </pre>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Files to Update:</Label>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <code className="bg-muted px-1 py-0.5 rounded">lib/firebase-config.ts</code>
                </li>
                <li>
                  <code className="bg-muted px-1 py-0.5 rounded">app/firebase-init.tsx</code>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

