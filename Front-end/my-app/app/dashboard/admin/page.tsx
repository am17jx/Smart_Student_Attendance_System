"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuthStore } from "@/stores/authStore"
import { Users, BookOpen, GraduationCap, Building2 } from "lucide-react"

export default function AdminDashboardPage() {
    const { user } = useAuthStore()

    const stats = [
        {
            title: "إجمالي الطلاب",
            value: "1,234",
            icon: Users,
            description: "+20 طالب جديد هذا الشهر",
        },
        {
            title: "إجمالي الأساتذة",
            value: "45",
            icon: GraduationCap,
            description: "نشطون حالياً",
        },
        {
            title: "المواد الدراسية",
            value: "32",
            icon: BookOpen,
            description: "موزعة عبر الأقسام",
        },
        {
            title: "الأقسام",
            value: "4",
            icon: Building2,
            description: "علوم حاسوب، هندسة...",
        },
    ]

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">مرحباً، {user?.name} 👋</h1>
                <p className="text-muted-foreground">
                    هذه نظرة عامة على ما يحدث في نظام الحضور اليوم.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, index) => (
                    <Card key={index}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground">
                                {stat.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>نظرة عامة</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        {/* Chart placeholder */}
                        <div className="h-[200px] flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                            قريباً: رسم بياني للحضور
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>النشاطات الأخيرة</CardTitle>
                    </CardHeader>  
                    <CardContent>
                        <div className="space-y-8">
                            {/* List placeholder */}
                            <div className="flex items-center">
                                <div className="ml-4 space-y-1">
                                    <p className="text-sm font-medium leading-none">تسجيل طالب جديد</p>
                                    <p className="text-sm text-muted-foreground">أحمد علي - قسم هندسة</p>
                                </div>
                                <div className="mr-auto font-medium text-sm text-green-600">+ دقيقتين</div>
                            </div>
                            <div className="flex items-center">
                                <div className="ml-4 space-y-1">
                                    <p className="text-sm font-medium leading-none">إنشاء محاضرة جديدة</p>
                                    <p className="text-sm text-muted-foreground">د. سارة - برمجة متقدمة</p>
                                </div>
                                <div className="mr-auto font-medium text-sm text-blue-600">+ 15 دقيقة</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
