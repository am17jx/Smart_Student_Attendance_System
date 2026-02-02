import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ArrowLeft, Calendar, MapPin, Users, CheckCircle2, Clock, FileDown } from "lucide-react";
import { sessionsApi, attendanceApi, AttendanceRecord } from "@/lib/api";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";

export default function SessionDetails() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [isDownloadingReport, setIsDownloadingReport] = useState(false);

    const { data: sessionData, isLoading: sessionLoading } = useQuery({
        queryKey: ['session', id],
        queryFn: async () => {
            if (!id) throw new Error("Session ID is required");
            const response = await sessionsApi.getById(id);
            return response.data?.session;
        },
        enabled: !!id,
    });

    const { data: attendanceData, isLoading: attendanceLoading, refetch } = useQuery({
        queryKey: ['session-attendance', id],
        queryFn: async () => {
            if (!id) throw new Error("Session ID is required");
            console.log("🔍 Fetching attendance for session:", id);
            const response = await attendanceApi.getBySession(id);
            console.log("📊 Attendance API Response:", response);
            console.log("📋 Attendance Records:", response.data?.records);
            return response.data?.records || [];
        },
        enabled: !!id,
        refetchInterval: 5000, // Auto-refresh every 5 seconds to show new attendance
    });

    if (sessionLoading || attendanceLoading) {
        return <LoadingSpinner />;
    }

    if (!sessionData) {
        return (
            <DashboardLayout>
                <div className="text-center py-12">
                    <h2 className="text-2xl font-bold text-destructive">الجلسة غير موجودة</h2>
                    <Button asChild className="mt-4">
                        <Link to="/my-sessions">
                            <ArrowLeft className="h-4 w-4 ml-2" />
                            العودة للجلسات
                        </Link>
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    const columns = [
        {
            key: "student",
            header: "اسم الطالب",
            render: (record: AttendanceRecord) => (
                <div className="font-medium">
                    {record.student?.name || "غير معروف"}
                </div>
            ),
        },
        {
            key: "student_id",
            header: "الرقم الجامعي",
            render: (record: AttendanceRecord) => (
                <div className="text-muted-foreground">
                    {record.student?.student_id || "N/A"}
                </div>
            ),
        },
        {
            key: "department",
            header: "القسم",
            render: (record: AttendanceRecord) => (
                <div className="text-sm">
                    {record.student?.department?.name || "غير محدد"}
                </div>
            ),
        },
        {
            key: "stage",
            header: "المرحلة",
            render: (record: AttendanceRecord) => (
                <div className="text-sm">
                    {record.student?.stage?.name || "غير محدد"}
                </div>
            ),
        },
        {
            key: "marked_at",
            header: "وقت التسجيل",
            render: (record: AttendanceRecord) => (
                <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {format(new Date(record.marked_at), "p", { locale: ar })}
                </div>
            ),
        },
        {
            key: "status",
            header: "الحالة",
            render: (record: AttendanceRecord) => {
                const status = record.status || 'PRESENT'; // Fallback to PRESENT if undefined (legacy)

                if (status === 'ABSENT') {
                    return (
                        <Badge variant="destructive">
                            <Users className="h-3 w-3 ml-1" />
                            غائب
                        </Badge>
                    );
                } else if (status === 'LATE') {
                    return (
                        <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600">
                            <Clock className="h-3 w-3 ml-1" />
                            متأخر
                        </Badge>
                    );
                } else if (status === 'EXCUSED') {
                    return (
                        <Badge variant="secondary" className="bg-blue-500 hover:bg-blue-600">
                            <CheckCircle2 className="h-3 w-3 ml-1" />
                            معذور
                        </Badge>
                    );
                }

                return (
                    <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                        <CheckCircle2 className="h-3 w-3 ml-1" />
                        حاضر
                    </Badge>
                );
            },
        },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" asChild>
                            <Link to="/my-sessions">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">تفاصيل الجلسة</h1>
                            <p className="text-muted-foreground">عرض الحضور والتفاصيل</p>
                        </div>
                    </div>
                    <Badge variant={sessionData.is_active ? "default" : "secondary"} className="text-lg px-4 py-2">
                        {sessionData.is_active ? "نشطة" : "منتهية"}
                    </Badge>
                </div>

                {/* Session Info Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">المادة</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{sessionData.material?.name || "غير محدد"}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {sessionData.material?.department?.name || ""}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">الموقع</CardTitle>
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{sessionData.geofence?.name || "غير محدد"}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                نطاق: {sessionData.geofence?.radius_meters || 0} متر
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">عدد الحضور</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{attendanceData?.length || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                طالب مسجل
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Session Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>معلومات الجلسة</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <div>
                            <p className="text-sm text-muted-foreground">تاريخ الإنشاء</p>
                            <p className="font-medium">{format(new Date(sessionData.created_at), "PPP p", { locale: ar })}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">تنتهي في</p>
                            <p className="font-medium">{format(new Date(sessionData.expires_at), "PPP p", { locale: ar })}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">المحاضر</p>
                            <p className="font-medium">{sessionData.teacher?.name || "غير محدد"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">رمز الجلسة</p>
                            <p className="font-mono text-sm">{sessionData.id}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Attendance List */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>قائمة الحضور</CardTitle>
                                <CardDescription>
                                    الطلاب الذين سجلوا حضورهم في هذه الجلسة
                                    {sessionData.is_active && " (يتم التحديث تلقائياً)"}
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => refetch()}
                                >
                                    تحديث
                                </Button>
                                {/* Export Report Button - Only visible to teachers and admins */}
                                {(user?.role === 'teacher' || user?.role === 'admin') && (
                                    <Button
                                        variant="default"
                                        size="sm"
                                        className="gap-2"
                                        disabled={isDownloadingReport}
                                        onClick={async () => {
                                            setIsDownloadingReport(true);
                                            try {
                                                console.log('📥 [UI] Starting PDF download for session:', id);

                                                // Get the PDF blob directly
                                                const blob = await attendanceApi.getReport(id!);

                                                console.log('✅ [UI] Blob received:', {
                                                    size: blob.size,
                                                    type: blob.type
                                                });

                                                // Validate blob
                                                if (!blob || blob.size === 0) {
                                                    throw new Error('الملف المُحمل فارغ');
                                                }

                                                // Create download link
                                                const url = window.URL.createObjectURL(blob);
                                                const link = document.createElement('a');
                                                link.href = url;
                                                link.setAttribute('download', `attendance-report-${id}.pdf`);
                                                document.body.appendChild(link);
                                                link.click();

                                                // Cleanup
                                                link.remove();
                                                window.URL.revokeObjectURL(url);

                                                console.log('✅ [UI] PDF download initiated successfully');
                                            } catch (error) {
                                                console.error('❌ [UI] Failed to download report:', error);
                                                alert(`فشل تنزيل التقرير: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
                                            } finally {
                                                setIsDownloadingReport(false);
                                            }
                                        }}
                                    >
                                        <FileDown className="h-4 w-4" />
                                        {isDownloadingReport ? 'جاري التحميل...' : 'تصدير التقرير'}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {attendanceData && attendanceData.length > 0 ? (
                            <DataTable
                                data={attendanceData}
                                columns={columns}
                                searchKey="student"
                            />
                        ) : (
                            <div className="text-center py-12">
                                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">لا يوجد حضور بعد</h3>
                                <p className="text-muted-foreground">
                                    لم يسجل أي طالب حضوره في هذه الجلسة حتى الآن
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
