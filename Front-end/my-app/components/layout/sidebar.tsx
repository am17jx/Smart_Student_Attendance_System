"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import { useState } from "react"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    links: {
        title: string
        href: string
        icon: React.ComponentType<{ className?: string }>
        variant?: "default" | "ghost"
    }[]
}

export function Sidebar({ className, links }: SidebarProps) {
    const pathname = usePathname()
    const [open, setOpen] = useState(false)

    return (
        <>
            {/* Mobile Trigger */}
            <div className="md:hidden p-4 border-b flex items-center justify-between bg-background">
                <span className="font-bold text-lg">نظام الحضور</span>
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu className="h-6 w-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                        <nav className="flex flex-col gap-4 mt-8">
                            {links.map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.href}
                                    onClick={() => setOpen(false)}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
                                        pathname === link.href
                                            ? "bg-primary text-primary-foreground"
                                            : "hover:bg-muted"
                                    )}
                                >
                                    <link.icon className="h-4 w-4" />
                                    {link.title}
                                </Link>
                            ))}
                        </nav>
                    </SheetContent>
                </Sheet>
            </div>

            {/* Desktop Sidebar */}
            <div className={cn("pb-12 hidden md:block w-64 border-l h-screen sticky top-0 bg-background", className)}>
                <div className="space-y-4 py-4">
                    <div className="px-3 py-2">
                        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                            لوحة التحكم
                        </h2>
                        <div className="space-y-1">
                            {links.map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.href}
                                >
                                    <Button
                                        variant={pathname === link.href ? "secondary" : "ghost"}
                                        className="w-full justify-start gap-2"
                                    >
                                        <link.icon className="h-4 w-4" />
                                        {link.title}
                                    </Button>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
