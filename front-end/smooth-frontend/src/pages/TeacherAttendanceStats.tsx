import { useQuery } from "@tanstack/react-query";
import { attendanceApi } from "@/lib/api";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from "recharts";
import {
    Users,
    Calendar,
    TrendingUp,
    BookOpen,
    CheckCircle2,
    MapPin,
    Clock
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

export const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export default function TeacherAttendanceStats() {
    const { data: stats, isLoading, error } = useQuery({
        queryKey: ['teacher-attendance-stats'],
        queryFn: async () => {
            const response = await attendanceApi.getTeacherStats();
            return response.data;
        }
    });

    if (isLoading) return <LoadingSpinner />;

    if (error || !stats) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">حدث خطأ في تحميل الإحصائيات</p>
                </div>
            </DashboardLayout>
        );
    }

    const pieData = stats.byMaterial.map((item, index) => ({
        name: item.materialName,
        value: item.totalAttendees,
        color: COLORS[index % COLORS.length]
    }));

    return (
        <TeacherAttendanceStatsContent stats={stats} pieData={pieData} />
    );
}

// Reusable content component
export function TeacherAttendanceStatsContent({ stats, pieData }: {
    stats: NonNullable<Awaited<ReturnType<typeof attendanceApi.getTeacherStats>>['data']>;
    pieData: { name: string; value: number; color: string }[];
}) {
    return (
        <DashboardLayout>
            <div className="space-y-6 animate-in fade-in duration-500">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <TrendingUp className="h-8 w-8 text-primary" />
                        إحصائيات الحضور
                    </h1>
                    <p className="text-muted-foreground mt-2">نظرة شاملة على حضور الطلاب في جلساتك</p>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-violet-500/10 to-purple-500/5">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">إجمالي الجلسات</CardTitle>
                            <Calendar className="h-4 w-4 text-violet-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-violet-600">{stats.totalSessions}</div>
                            <p className="text-xs text-muted-foreground">جلسة تم إنشاؤها</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-cyan-500/10 to-blue-500/5">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">إجمالي الحضور</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-cyan-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-cyan-600">{stats.totalAttendees}</div>
                            <p className="text-xs text-muted-foreground">سجل حضور</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-emerald-500/10 to-green-500/5">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">متوسط الحضور</CardTitle>
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-emerald-600">{stats.avgAttendancePerSession}</div>
                            <p className="text-xs text-muted-foreground">طالب لكل جلسة</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-amber-500/10 to-orange-500/5">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">الطلاب الغائبين</CardTitle>
                            <Users className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-amber-600">{stats.totalAbsent}</div>
                            <p className="text-xs text-muted-foreground">حالة غياب مسجلة</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    {/* Monthly Attendance Trend */}
                    <Card className="col-span-4 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                اتجاه الحضور الشهري
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <div className="h-[300px]">
                                {stats.monthlyStats.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={stats.monthlyStats}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis
                                                dataKey="month"
                                                tickFormatter={(value) => {
                                                    const month = value.split('-')[1];
                                                    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
                                                        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
                                                    return monthNames[Number.parseInt(month, 10) - 1] || value;
                                                }}
                                                stroke="#888888"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <YAxis
                                                stroke="#888888"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <Tooltip
                                                formatter={(value: number, name: string) => [
                                                    value,
                                                    name === 'sessions' ? 'الجلسات' : name === 'attendees' ? 'الحضور' : 'الغياب'
                                                ]}
                                            />
                                            <Legend
                                                formatter={(value) => value === 'sessions' ? 'الجلسات' : value === 'attendees' ? 'الحضور' : 'الغياب'}
                                            />
                                            <Bar dataKey="sessions" fill="#8b5cf6" name="sessions" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="attendees" fill="#06b6d4" name="attendees" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="absent" fill="#ef4444" name="absent" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground">
                                        لا توجد بيانات شهرية
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Attendance by Material (Pie Chart) - Kept as Attendees Distribution */}
                    <Card className="col-span-3 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5" />
                                توزيع الحضور حسب المادة
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                {pieData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {pieData.map((entry) => (
                                                    <Cell key={`cell-${entry.name}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground">
                                        لا توجد بيانات
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Stats by Material */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5" />
                            تفاصيل الحضور والغياب حسب المادة
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats.byMaterial.length > 0 ? (
                            <div className="space-y-6">
                                {stats.byMaterial.map((item, index) => (
                                    <div key={item.materialId} className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="font-medium flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                                />
                                                {item.materialName}
                                            </div>
                                            <div className="text-muted-foreground">
                                                {item.totalSessions} جلسة • {item.totalAttendees} حضور • {item.totalAbsent} غياب
                                            </div>
                                        </div>
                                        {/* Progress Bar: Green for Present, Red for Absent (visualized as remaining) */}
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="text-green-600 font-bold">{item.attendanceRate}% حضور</span>
                                            <span className="ml-auto text-red-500 font-bold">{100 - item.attendanceRate}% غياب</span>
                                        </div>
                                        <Progress
                                            value={item.attendanceRate}
                                            className="h-2 bg-red-100"
                                            indicatorClassName={`bg-green-500`}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                لا توجد بيانات للمواد
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Sessions */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            آخر الجلسات
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats.recentSessions.length > 0 ? (
                            <div className="space-y-4">
                                {stats.recentSessions.map((session) => (
                                    <Link
                                        key={session.id}
                                        to={`/sessions/${session.id}`}
                                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-full ${session.isActive ? 'bg-green-100' : 'bg-slate-100'}`}>
                                                <BookOpen className={`h-4 w-4 ${session.isActive ? 'text-green-600' : 'text-slate-500'}`} />
                                            </div>
                                            <div>
                                                <p className="font-medium">{session.materialName}</p>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <MapPin className="h-3 w-3" />
                                                    {session.location}
                                                    <span>•</span>
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(session.date).toLocaleDateString('ar-SA')}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={session.isActive ? "default" : "secondary"}>
                                                {session.isActive ? 'نشطة' : 'منتهية'}
                                            </Badge>
                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                <Users className="h-4 w-4" />
                                                <span className="font-medium">{session.attendeeCount}</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                لا توجد جلسات حديثة
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
