"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export default function ForgotPasswordPage() {
    const [email, setEmail] = React.useState("")
    const [loading, setLoading] = React.useState(false)
    const [submitted, setSubmitted] = React.useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!email) {
            toast.error("Please enter your email address")
            return
        }

        setLoading(true)

        try {
            await api.post("/auth/forgot-password", {
                email: email.trim(),
            })

            setSubmitted(true)
            toast.success("Reset link sent to your email")
        } catch (err: any) {
            console.error("Forgot password error:", err)
            const message =
                err.response?.data?.message ||
                "Something went wrong. Please try again."
            toast.error(message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
            <div className="flex w-full max-w-sm flex-col gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">Forgot Password</CardTitle>
                        <CardDescription>
                            {submitted
                                ? "Check your email for a reset link."
                                : "Enter your email address and we'll send you a link to reset your password."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {submitted ? (
                            <div className="flex flex-col gap-4">
                                <div className="rounded-md bg-green-50 p-4 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-300">
                                    If an account exists for <strong>{email}</strong>, you will receive password reset instructions.
                                </div>
                                <Button variant="outline" className="w-full" onClick={() => setSubmitted(false)}>
                                    Try another email
                                </Button>
                                <Button variant="ghost" className="w-full" asChild>
                                    <a href="/login">Back to Login</a>
                                </Button>
                            </div>
                        ) : (
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
                                    <Button type="submit" className="w-full" disabled={loading}>
                                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        {loading ? "Sending link..." : "Send Reset Link"}
                                    </Button>
                                    <Button variant="ghost" className="w-full" asChild>
                                        <a href="/login">Back to Login</a>
                                    </Button>
                                </div>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
