"use client"

import { useAuthStore } from "@/stores/authStore"
import { useRouter } from "next/navigation"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut, User } from "lucide-react"

export function Header() {
    const { user, logout } = useAuthStore()
    const router = useRouter()

    const handleLogout = () => {
        logout()
        router.push("/login")
    }

    return (
        <header className="border-b h-16 flex items-center justify-between px-6 bg-background">
            <div className="font-semibold text-lg md:hidden">
                {/* Title is hidden on mobile here because it's in the mobile sidebar trigger bar, but kept for structure */}
            </div>

            <div className="flex items-center gap-4 mr-auto">
                {/* mr-auto because RTL, so this pushes to the left */}
                <span className="text-sm text-muted-foreground hidden md:inline-block">
                    مرحباً، {user?.name || "المستخدم"}
                </span>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src="/avatars/01.png" alt={user?.name} />
                                <AvatarFallback>{user?.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{user?.name}</p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {user?.email}
                                </p>
                                <p className="text-xs font-semibold text-primary mt-1">
                                    {user?.role?.toUpperCase()}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 cursor-pointer">
                            <LogOut className="ml-2 h-4 w-4" />
                            <span className="ml-2">تسجيل الخروج</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
