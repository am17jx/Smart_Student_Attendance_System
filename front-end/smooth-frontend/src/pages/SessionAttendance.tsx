import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { attendanceApi } from "@/lib/api";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowRight, Users, UserCheck, UserX, Percent, Search, FileDown } from "lucide-react";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function SessionAttendance() {
    const { id } = useParams<{ id: string }>();
    const [searchQuery, setSearchQuery] = useState("");

    const { data: report, isLoading, error } = useQuery({
        queryKey: ['session-report', id],
        queryFn: () => attendanceApi.getSessionReport(id!),
        enabled: !!id
    });

    const [isDownloading, setIsDownloading] = useState(false);

    const downloadPdf = async () => {
        try {
            setIsDownloading(true);
            const blob = await attendanceApi.getReport(id!);



            // Check file signature (Magic Bytes)
            const arrayBuffer = await blob.arrayBuffer();
            const firstBytes = new Uint8Array(arrayBuffer.slice(0, 5));
            const headerString = new TextDecoder().decode(firstBytes);


            if (headerString !== '%PDF-') {
                console.error("❌ Invalid PDF Header:", headerString);
                const text = await blob.text();
                console.error("❌ Full Blob Content:", text.slice(0, 500)); // Log first 500 chars
                alert(`الملف المحمل ليس PDF صالحاً! (Header: ${headerString})`);
                return;
            }

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `attendance-report-${id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Failed to download report", error);
            alert("فشل تحميل التقرير. الرجاء المحاولة مرة أخرى.");
        } finally {
            setIsDownloading(false);
        }
    };

    // Auto-download removed


    if (isLoading) return <LoadingSpinner />;

    if (error || !report) {
        return (
            <DashboardLayout>
                <Alert variant="destructive">
                    <AlertDescription>
                        حدث خطأ أثناء تحميل تقرير الحضور: {(error as Error)?.message || "لم يتم العثور على التقرير"}
                    </AlertDescription>
                </Alert>
                <Button asChild className="mt-4" variant="outline">
                    <Link to="/my-sessions">
                        <ArrowRight className="h-4 w-4 ms-2" />
                        عودة للجلسات
                    </Link>
                </Button>
            </DashboardLayout>
        );
    }

    if (!report?.data) return null;
    const { session, statistics, presentStudents, absentStudents } = report.data;

    const filterStudents = <T extends { name: string; student_id?: string; email: string }>(students: T[]) => {
        return students.filter(s =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.student_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.email.toLowerCase().includes(searchQuery.toLowerCase())
        );
    };

    const filteredPresent = filterStudents(presentStudents);
    const filteredAbsent = filterStudents(absentStudents);

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Button variant="ghost" size="sm" asChild className="p-0 h-auto hover:bg-transparent">
                            <Link to="/my-sessions" className="flex items-center gap-1">
                                <ArrowRight className="h-4 w-4" />
                                جلساتي
                            </Link>
                        </Button>
                        <span>/</span>
                        <span>تقرير الحضور</span>
                    </div>

                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold tracking-tight">تقرير الحضور: {session.material?.name}</h1>
                                <Button onClick={downloadPdf} disabled={isDownloading} variant="outline" size="sm" className="gap-2">
                                    {isDownloading ? <LoadingSpinner className="h-4 w-4" /> : <FileDown className="h-4 w-4" />}
                                    {isDownloading ? "جاري التحميل..." : "تحميل PDF"}
                                </Button>
                            </div>
                            <p className="text-muted-foreground mt-1">
                                {format(new Date(session.created_at), "PPP p", { locale: ar })}
                            </p>
                            <div className="flex gap-2 mt-2">
                                <span className="bg-primary/10 text-primary px-2 py-1 rounded-md text-sm">
                                    {session.material?.department?.name}
                                </span>
                                <span className="bg-primary/10 text-primary px-2 py-1 rounded-md text-sm">
                                    {session.material?.stage?.name}
                                </span>
                            </div>
                        </div>

                        <div className={`px-4 py-2 rounded-lg border ${statistics.attendanceRate >= 75 ? 'bg-green-50 border-green-200 text-green-700' :
                            statistics.attendanceRate >= 50 ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                                'bg-red-50 border-red-200 text-red-700'
                            }`}>
                            <div className="text-sm font-medium">نسبة الحضور</div>
                            <div className="text-2xl font-bold">{statistics.attendanceRate}%</div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">إجمالي الطلاب</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.totalStudents}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">الحضور</CardTitle>
                            <UserCheck className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{statistics.presentCount}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">الغياب</CardTitle>
                            <UserX className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{statistics.absentCount}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="بحث عن طالب..."
                        className="w-full pr-10 py-2 border rounded-md"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Students Lists */}
                <Tabs defaultValue="present" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="present" className="data-[state=active]:bg-green-50 data-[state=active]:text-green-700">
                            الحاضرون ({filteredPresent.length})
                        </TabsTrigger>
                        <TabsTrigger value="absent" className="data-[state=active]:bg-red-50 data-[state=active]:text-red-700">
                            الغائبون ({filteredAbsent.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="present">
                        <Card>
                            <CardContent className="pt-6">
                                {filteredPresent.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">لا يوجد طلاب حاضرين</div>
                                ) : (
                                    <div className="space-y-4">
                                        {filteredPresent.map(student => (
                                            <div key={student.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 bg-green-50/10 border-green-100">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-900">{student.name}</span>
                                                    <span className="text-sm text-gray-500">{student.email}</span>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                                                        {student.student_id}
                                                    </span>
                                                    <span className="text-xs text-green-600 font-medium">
                                                        {format(new Date(student.marked_at), "h:mm a")}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="absent">
                        <Card>
                            <CardContent className="pt-6">
                                {filteredAbsent.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">لا يوجد طلاب غائبين</div>
                                ) : (
                                    <div className="space-y-4">
                                        {filteredAbsent.map(student => (
                                            <div key={student.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 bg-red-50/10 border-red-100">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-900">{student.name}</span>
                                                    <span className="text-sm text-gray-500">{student.email}</span>
                                                </div>
                                                <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                                                    {student.student_id}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
