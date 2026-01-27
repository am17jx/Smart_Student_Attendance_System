"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import {
    LayoutDashboard,
    Building2,
    GraduationCap,
    BookOpen,
    Users,
    UserCog
} from "lucide-react"

const adminLinks = [
    {
        title: "لوحة التحكم",
        href: "/dashboard/admin",
        icon: LayoutDashboard,
    },
    {
        title: "إدارة الأقسام",
        href: "/dashboard/admin/departments",
        icon: Building2,
    },
    {
        title: "إدارة المراحل",
        href: "/dashboard/admin/stages",
        icon: GraduationCap,
    },
    {
        title: "إدارة المواد",
        href: "/dashboard/admin/materials",
        icon: BookOpen,
    },
    {
        title: "إدارة الأساتذة",
        href: "/dashboard/admin/teachers",
        icon: UserCog,
    },
    {
        title: "إدارة الطلاب",
        href: "/dashboard/admin/students",
        icon: Users,
    },
]

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen overflow-hidden bg-secondary/10">
            <Sidebar links={adminLinks} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
