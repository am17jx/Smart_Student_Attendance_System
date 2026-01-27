"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error)
    }, [error])

    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-muted/50 text-center">
            <h2 className="text-2xl font-bold tracking-tight">Something went wrong!</h2>
            <p className="text-muted-foreground">
                We encountered an error while processing your request.
            </p>
            <div className="flex gap-2">
                <Button onClick={() => reset()}>Try again</Button>
                <Button variant="outline" asChild>
                    <a href="/">Go Home</a>
                </Button>
            </div>
        </div>
    )
}
