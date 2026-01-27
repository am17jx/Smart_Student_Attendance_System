"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api"
import { useAuthStore } from "@/stores/authStore"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface LoginFormProps extends React.ComponentPropsWithoutRef<"div"> { }

export function LoginForm({ className, ...props }: LoginFormProps) {
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const router = useRouter()
  const { setAuth } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      toast.error("Please fill in all fields")
      return
    }

    setLoading(true)

    try {
      const response = await api.post("/auth/login", {
        email: email.trim(),
        password,
      })

      const { token, role, status } = response.data

      if (status === "must_change_password") {
        toast.warning("You must change your password first.")
        // You might want to redirect to a change password page here
        // router.push(`/change-password?email=${email}`)
        return
      }

      setAuth(
        {
          id: "", // The backend might not be returning ID in this response, adjust if needed
          email: email.trim(),
          name: "", // You could fetch the user profile after login to fill this
          role: role,
        },
        token
      )

      toast.success("Login successful")

      const redirectPath =
        role === "admin"
          ? "/dashboard/admin"
          : role === "teacher"
            ? "/dashboard/teacher"
            : role === "student"
              ? "/dashboard/student"
              : "/dashboard"

      router.push(redirectPath)
    } catch (err: any) {
      console.error("Login error:", err)

      let message = "Something went wrong. Please try again."

      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        message = err.response.data?.message || "Invalid email or password"
      } else if (err.request) {
        // The request was made but no response was received (Network Error)
        message = "Cannot connect to the server. Please check if the backend is running."
      } else {
        // Something happened in setting up the request that triggered an Error
        message = err.message
      }

      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {loading ? "Logging in..." : "Login"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
