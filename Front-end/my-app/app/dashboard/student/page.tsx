"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/stores/authStore"
import { QrCode, CheckCircle2, XCircle } from "lucide-react"
import Link from "next/link"

export default function StudentDashboardPage() {
    const { user } = useAuthStore()

    return (
        <div className="space-y-6 max-w-lg mx-auto md:max-w-none">
            <div className="md:flex justify-between items-center text-center md:text-right">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">أهلاً {user?.name} 👋</h1>
                    <p className="text-muted-foreground">
                        لا تنسى تسجيل حضورك اليوم!
                    </p>
                </div>
                <Link href="/student/scan" className="mt-4 md:mt-0 block">
                    <Button size="lg" className="w-full md:w-auto gap-2 text-lg h-12">
                        <QrCode className="h-5 w-5" />
                        مسح الكود (Scan QR)
                    </Button>
                </Link>
            </div>

            <div className="grid gap-4 grid-cols-2">
                <Card className="bg-green-50 border-green-200">
                    <CardContent className="pt-6 text-center">
                        <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-green-700">92%</div>
                        <p className="text-xs text-green-600 font-medium">نسبة الحضور</p>
                    </CardContent>
                </Card>

                <Card className="bg-red-50 border-red-200">
                    <CardContent className="pt-6 text-center">
                        <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-red-700">2</div>
                        <p className="text-xs text-red-600 font-medium">غيابات</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>محاضرات اليوم</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* List placeholder */}
                        <div className="flex items-center p-3 bg-secondary/50 rounded-lg border">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                8:30
                            </div>
                            <div className="mr-4 space-y-1">
                                <p className="font-semibold">برمجة متقدمة</p>
                                <p className="text-sm text-muted-foreground">القاعة 402 - د. سارة</p>
                            </div>
                            <div className="mr-auto">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    حاضر
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center p-3 bg-background rounded-lg border border-dashed">
                            <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground font-bold">
                                10:30
                            </div>
                            <div className="mr-4 space-y-1">
                                <p className="font-semibold">قواعد بيانات</p>
                                <p className="text-sm text-muted-foreground">المختبر 2 - د. محمد</p>
                            </div>
                            <div className="mr-auto">
                                <Button variant="ghost" size="sm" className="h-8 text-xs">
                                    لم تبدأ
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
