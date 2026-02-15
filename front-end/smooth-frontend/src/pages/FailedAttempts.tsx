import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { AlertTriangle, User, BookOpen, Calendar, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function FailedAttemptsPage() {
    const { user } = useAuth();

    const { data, isLoading, error } = useQuery({
        queryKey: [user?.role === 'admin' ? 'adminDashboard' : 'teacherDashboard'],
        queryFn: async () => {
            if (user?.role === 'admin') {
                const response = await dashboardApi.getAdminDashboard();
                return response.data;
            } else {
                const response = await dashboardApi.getTeacherDashboard();
                return response.data;
            }
        }
    });

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center p-8">
                    <LoadingSpinner />
                </div>
            </DashboardLayout>
        );
    }

    if (error || !data) {
        return (
            <DashboardLayout>
                <div className="text-destructive p-4">فشل تحميل البيانات</div>
            </DashboardLayout>
        );
    }

    const failedAttempts = data.failedAttempts || [];

    const getErrorTypeLabel = (errorType: string) => {
        const labels: Record<string, string> = {
            'QR_TOKEN_NOT_FOUND': 'رمز QR غير موجود',
            'GEOFENCE_VIOLATION': 'خارج نطاق القاعة',
            'UNAUTHORIZED_STUDENT': 'طالب غير مصرح',
            'INVALID_HASH': 'رمز غير صحيح',
            'TOKEN_EXPIRED': 'انتهت الصلاحية',
            'TOKEN_ALREADY_USED': 'تم استخدام الرمز',
            'INVALID_CREDENTIALS': 'بيانات دخول خاطئة',
            'EMAIL_NOT_VERIFIED': 'بريد غير مفعّل',
            'FINGERPRINT_MISMATCH': 'جهاز غير مطابق',
        };
        return labels[errorType] || errorType;
    };

    const getErrorTypeBadge = (errorType: string) => {
        const badges: Record<string, { bg: string; text: string }> = {
            'GEOFENCE_VIOLATION': { bg: 'bg-warning/10', text: 'text-warning' },
            'UNAUTHORIZED_STUDENT': { bg: 'bg-destructive/10', text: 'text-destructive' },
            'TOKEN_EXPIRED': { bg: 'bg-muted', text: 'text-muted-foreground' },
            'INVALID_HASH': { bg: 'bg-destructive/10', text: 'text-destructive' },
            'INVALID_CREDENTIALS': { bg: 'bg-orange-500/10', text: 'text-orange-600' },
            'EMAIL_NOT_VERIFIED': { bg: 'bg-yellow-500/10', text: 'text-yellow-600' },
            'FINGERPRINT_MISMATCH': { bg: 'bg-purple-500/10', text: 'text-purple-600' },
        };
        const badge = badges[errorType] || { bg: 'bg-muted', text: 'text-muted-foreground' };
        return (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                {getErrorTypeLabel(errorType)}
            </span>
        );
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <AlertTriangle className="h-6 w-6 text-destructive" />
                        محاولات تسجيل الحضور الفاشلة
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        جميع المحاولات غير المصرح بها لتسجيل الحضور
                    </p>
                </div>

                {/* Stats Card */}
                <Card className="shadow-card border-destructive/20">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-destructive/10">
                                <AlertCircle className="h-8 w-8 text-destructive" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{failedAttempts.length}</p>
                                <p className="text-sm text-muted-foreground">إجمالي المحاولات الفاشلة</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Failed Attempts Table */}
                <Card className="shadow-card">
                    <CardHeader>
                        <CardTitle>سجل المحاولات الفاشلة</CardTitle>
                        <CardDescription>
                            تفاصيل كاملة عن جميع محاولات تسجيل الحضور غير الناجحة
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {failedAttempts.length > 0 ? (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-right">الطالب</TableHead>
                                            <TableHead className="text-right">المادة</TableHead>
                                            {user?.role === 'admin' && (
                                                <TableHead className="text-right">الأستاذ</TableHead>
                                            )}
                                            <TableHead className="text-right">نوع الخطأ</TableHead>
                                            <TableHead className="text-right">الرسالة</TableHead>
                                            <TableHead className="text-right">التاريخ والوقت</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {failedAttempts.map((attempt: any) => (
                                            <TableRow key={attempt.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                        <div>
                                                            <p className="font-medium">{attempt.student?.name || 'غير معروف'}</p>
                                                            {attempt.student?.student_id && (
                                                                <p className="text-xs text-muted-foreground">
                                                                    {attempt.student.student_id}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm">
                                                            {attempt.session?.material?.name || 'غير محدد'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                {user?.role === 'admin' && (
                                                    <TableCell>
                                                        <span className="text-sm">
                                                            {attempt.session?.teacher?.name || 'غير محدد'}
                                                        </span>
                                                    </TableCell>
                                                )}
                                                <TableCell>
                                                    {getErrorTypeBadge(attempt.error_type)}
                                                </TableCell>
                                                <TableCell>
                                                    <p className="text-sm text-muted-foreground max-w-xs truncate">
                                                        {attempt.error_message || 'لا توجد تفاصيل'}
                                                    </p>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm">
                                                            {new Date(attempt.attempted_at).toLocaleString('ar-EG', {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                                <p className="text-muted-foreground">لا توجد محاولات فاشلة</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    جميع محاولات تسجيل الحضور كانت ناجحة
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
