import { Loader2 } from "lucide-react"

export default function Loading() {
    return (
        <div className="flex min-h-svh w-full items-center justify-center bg-muted/50">
            <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
        </div>
    )
}
