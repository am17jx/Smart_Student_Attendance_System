import { useQuery } from "@tanstack/react-query";
import { attendanceApi } from "@/lib/api";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    BarChart,
    Bar
} from "recharts";
import {
    CheckCircle2,
    XCircle,
    TrendingUp,
    Calendar,
    AlertTriangle,
    Award
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function AttendanceStats() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['attendance-stats'],
        queryFn: async () => {
            const response = await attendanceApi.getMyStats();
            return response.data;
        }
    });

    if (isLoading) return <LoadingSpinner />;

    if (!stats) return null;

    const pieData = [
        { name: 'حاضر', value: stats.attendedSessions, color: '#22c55e' },
        { name: 'غائب', value: stats.missedSessions, color: '#ef4444' }
    ];

    const getStatusColor = (rate: number) => {
        if (rate >= 90) return "text-green-600";
        if (rate >= 75) return "text-yellow-600";
        return "text-red-600";
    };

    const getStatusMessage = (status: string) => {
        switch (status) {
            case 'excellent': return "ممتاز! استمر في هذا الأداء الرائع 🌟";
            case 'good': return "جيد جداً، حافظ على حضورك 👍";
            case 'needs_improvement': return "تحتاج للاهتمام أكثر بحضورك ⚠️";
            case 'poor': return "حضورك منخفض جداً، يرجى مراجعة المرشد الأكاديمي 🚨";
            default: return "";
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-in fade-in duration-500">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <TrendingUp className="h-8 w-8 text-primary" />
                        إحصائيات الحضور
                    </h1>
                    <p className="text-muted-foreground mt-2">نظرة شاملة على أدائك في الحضور والغياب</p>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">إجمالي الجلسات</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalSessions}</div>
                            <p className="text-xs text-muted-foreground">جلسة مسجلة</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">عدد مرات الحضور</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{stats.attendedSessions}</div>
                            <p className="text-xs text-muted-foreground">جلسة</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">نسبة الحضور</CardTitle>
                            <Award className={`h-4 w-4 ${getStatusColor(stats.attendanceRate)}`} />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${getStatusColor(stats.attendanceRate)}`}>
                                {stats.attendanceRate}%
                            </div>
                            <Progress value={stats.attendanceRate} className="h-2 mt-2" />
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">الحالة العامة</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold truncate">
                                {stats.status === 'excellent' && "ممتاز"}
                                {stats.status === 'good' && "جيد"}
                                {stats.status === 'needs_improvement' && "يحتاج تحسين"}
                                {stats.status === 'poor' && "منخفض"}
                            </div>
                            <p className="text-xs text-muted-foreground truncate" title={getStatusMessage(stats.status)}>
                                {getStatusMessage(stats.status)}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">

                    {/* Recent Attendance (Line Chart) */}
                    <Card className="col-span-4 shadow-sm">
                        <CardHeader>
                            <CardTitle>نشاط الحضور (آخر 30 يوم)</CardTitle>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={stats.recentAttendance}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={(value) => new Date(value).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' })}
                                            stroke="#888888"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            tickFormatter={(value) => value ? 'حاضر' : 'غائب'}
                                            domain={[0, 1]}
                                            ticks={[0, 1]}
                                            stroke="#888888"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <Tooltip
                                            labelFormatter={(value) => new Date(value).toLocaleDateString('ar-SA')}
                                            formatter={(value: any) => [value ? 'حاضر' : 'غائب', 'الحالة']}
                                        />
                                        <Line
                                            type="step"
                                            dataKey="attended"
                                            stroke="#8884d8"
                                            strokeWidth={2}
                                            dot={{ r: 4 }}
                                            activeDot={{ r: 8 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Attendance Distribution (Pie Chart) */}
                    <Card className="col-span-3 shadow-sm">
                        <CardHeader>
                            <CardTitle>توزيع الحضور والغياب</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
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
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Stats by Material */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>الحضور حسب المادة</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {stats.byMaterial.map((item: any) => (
                                <div key={item.materialId} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="font-medium">{item.materialName}</div>
                                        <div className="text-muted-foreground">
                                            {item.attended} / {item.totalSessions} جلسة ({item.rate}%)
                                        </div>
                                    </div>
                                    <Progress
                                        value={item.rate}
                                        className={`h-2 ${item.rate < 75 ? "bg-red-100" : "bg-slate-100"
                                            }`}
                                        indicatorClassName={`${item.rate >= 90 ? "bg-green-600" :
                                                item.rate >= 75 ? "bg-yellow-600" : "bg-red-600"
                                            }`}
                                    />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
