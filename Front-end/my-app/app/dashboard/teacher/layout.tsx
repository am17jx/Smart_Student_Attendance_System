"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import {
    LayoutDashboard,
    BookOpen,
    QrCode,
    FileBarChart,
    Calendar
} from "lucide-react"

const teacherLinks = [
    {
        title: "لوحة التحكم",
        href: "/dashboard/teacher",
        icon: LayoutDashboard,
    },
    {
        title: "مكتبي (المواد)",
        href: "/dashboard/teacher/subjects",
        icon: BookOpen,
    },
    {
        title: "إنشاء جلسة (QR)",
        href: "/dashboard/teacher/sessions/create",
        icon: QrCode,
    },
    {
        title: "جدول المحاضرات",
        href: "/dashboard/teacher/schedule",
        icon: Calendar,
    },
    {
        title: "تقارير الحضور",
        href: "/dashboard/teacher/reports",
        icon: FileBarChart,
    },
]

export default function TeacherLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen overflow-hidden bg-secondary/10">
            <Sidebar links={teacherLinks} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
