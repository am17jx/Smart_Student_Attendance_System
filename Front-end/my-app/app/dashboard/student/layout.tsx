"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import {
    LayoutDashboard,
    QrCode,
    Clock,
    CalendarDays
} from "lucide-react"

const studentLinks = [
    {
        title: "الرئيسية",
        href: "/dashboard/student",
        icon: LayoutDashboard,
    },
    {
        title: "تسجيل حضور (QR)",
        href: "/dashboard/student/scan",
        icon: QrCode,
    },
    {
        title: "سجلي (الحضور)",
        href: "/dashboard/student/attendance",
        icon: Clock,
    },
    {
        title: "جدولي",
        href: "/dashboard/student/schedule",
        icon: CalendarDays,
    },
]

export default function StudentLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen overflow-hidden bg-secondary/10">
            <Sidebar links={studentLinks} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-4 pb-20 md:p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
