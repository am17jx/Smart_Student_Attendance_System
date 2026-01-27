"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/stores/authStore"
import { BookOpen, QrCode, Users } from "lucide-react"
import Link from "next/link"

export default function TeacherDashboardPage() {
    const { user } = useAuthStore()

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">مرحباً دكتور {user?.name} 👨‍🏫</h1>
                    <p className="text-muted-foreground">
                        جاهز لمحاضرة اليوم؟
                    </p>
                </div>
                <Link href="/teacher/sessions/create">
                    <Button className="gap-2">
                        <QrCode className="h-4 w-4" />
                        إنشاء رمز حضور (QR)
                    </Button>
                </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">المحاضرات اليوم</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">3</div>
                        <p className="text-xs text-muted-foreground">التالية: برمجة web (10:30)</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">إجمالي الطلاب</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">120</div>
                        <p className="text-xs text-muted-foreground">في جميع المواد</p>
                    </CardContent>
                </Card>
            </div>

            <h2 className="text-xl font-semibold mt-8 mb-4">مواد أدرّسها</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Placeholder for subjects */}
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="hover:bg-secondary/5 transition cursor-pointer">
                        <CardHeader>
                            <CardTitle>مادة البرمجة {i}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">المرحلة الثالثة - قسم الحاسبات</p>
                            <Button variant="outline" className="w-full">عرض التفاصيل</Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
