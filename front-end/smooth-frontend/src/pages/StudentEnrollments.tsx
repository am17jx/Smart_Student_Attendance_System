import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentsApi, materialsApi, enrollmentApi, Enrollment } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { BookCheck, CheckCircle2, XCircle, Ban, Save } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type EnrollmentWithStatus = Enrollment & {
    newStatus?: string;
};

export default function StudentEnrollments() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [selectedStudentId, setSelectedStudentId] = useState("");
    const [academicYear, setAcademicYear] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [enrollments, setEnrollments] = useState<EnrollmentWithStatus[]>([]);


    const { data: studentsData } = useQuery({
        queryKey: ['students', 1, searchQuery],
        queryFn: async () => {
            const response = await studentsApi.getAll(1, 100, searchQuery);
            return response.data?.students || [];
        },
    });


    const { data: materials } = useQuery({
        queryKey: ['materials'],
        queryFn: async () => {
            const response = await materialsApi.getAll();
            return response.data?.materials || [];
        }
    });


    const { data: enrollmentsData, isLoading, refetch } = useQuery({
        queryKey: ['student-enrollments', selectedStudentId, academicYear],
        queryFn: async () => {
            if (!selectedStudentId) return [];
            const response = await enrollmentApi.getStudentEnrollments(selectedStudentId, academicYear);
            return Array.isArray(response.data) ? response.data : [];
        },
        enabled: !!selectedStudentId,
    });


    useEffect(() => {
        if (enrollmentsData) {
            setEnrollments(enrollmentsData.map((e: any) => ({ ...e, newStatus: e.result_status })));
        }
    }, [enrollmentsData]);


    const bulkCreateMutation = useMutation({
        mutationFn: (data: { student_id: string; material_ids: string[]; academic_year: string }) =>
            enrollmentApi.bulkCreate(data),
        onSuccess: () => {
            toast({ title: "تم تسجيل المواد بنجاح" });
            refetch();
        },
        onError: (error: Error) => {
            toast({ title: "فشل التسجيل", description: error.message, variant: "destructive" });
        }
    });


    const bulkUpdateMutation = useMutation({
        mutationFn: (updates: Array<{ id: string; result_status: string }>) =>
            enrollmentApi.bulkUpdateStatus(updates),
        onSuccess: () => {
            toast({ title: "تم حفظ النتائج بنجاح" });
            refetch();
        },
        onError: (error: Error) => {
            toast({ title: "فشل حفظ النتائج", description: error.message, variant: "destructive" });
        }
    });

    const handleStatusChange = (enrollmentId: string, newStatus: string) => {
        setEnrollments(prev =>
            prev.map(e => e.id === enrollmentId ? { ...e, newStatus } : e)
        );
    };

    const handleSaveAll = () => {
        const updates = enrollments
            .filter(e => e.newStatus && e.newStatus !== e.result_status)
            .map(e => ({ id: e.id, result_status: e.newStatus! }));

        if (updates.length === 0) {
            toast({ title: "لا توجد تغييرات للحفظ", variant: "default" });
            return;
        }

        bulkUpdateMutation.mutate(updates);
    };


    const selectedStudent = studentsData?.find(s => s.id === selectedStudentId);


    const relevantMaterials = materials?.filter(m =>
        selectedStudent &&
        m.department_id === selectedStudent.department_id &&
        m.stage_id === selectedStudent.stage_id
    ) || [];

    const handleEnrollAll = () => {
        if (!selectedStudentId || !academicYear || relevantMaterials.length === 0) {
            toast({ title: "لا توجد مواد متاحة لهذا القسم والمرحلة", variant: "destructive" });
            return;
        }

        const materialIds = relevantMaterials.map(m => m.id);
        bulkCreateMutation.mutate({
            student_id: selectedStudentId,
            material_ids: materialIds,
            academic_year: academicYear,
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PASSED':
                return <Badge className="bg-success"><CheckCircle2 className="h-3 w-3 ml-1 inline" />ناجح</Badge>;
            case 'FAILED':
                return <Badge variant="destructive"><XCircle className="h-3 w-3 ml-1 inline" />راسب</Badge>;
            case 'BLOCKED_BY_ABSENCE':
                return <Badge className="bg-warning"><Ban className="h-3 w-3 ml-1 inline" />محجوب</Badge>;
            case 'IN_PROGRESS':
                return <Badge variant="outline">قيد الدراسة</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    const columns = [
        {
            key: "material",
            header: "المادة",
            render: (row: EnrollmentWithStatus) => row.material?.name || "-"
        },
        {
            key: "current_status",
            header: "الحالة الحالية",
            render: (row: EnrollmentWithStatus) => getStatusBadge(row.result_status)
        },
        {
            key: "new_status",
            header: "النتيجة الجديدة",
            render: (row: EnrollmentWithStatus) => (
                <Select
                    value={row.newStatus || row.result_status}
                    onValueChange={(value) => handleStatusChange(row.id, value)}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="PASSED">ناجح</SelectItem>
                        <SelectItem value="FAILED">راسب</SelectItem>
                        <SelectItem value="BLOCKED_BY_ABSENCE">محجوب بالغياب</SelectItem>
                        <SelectItem value="IN_PROGRESS">قيد الدراسة</SelectItem>
                    </SelectContent>
                </Select>
            )
        },
        {
            key: "is_carried",
            header: "مادة محملة",
            render: (row: EnrollmentWithStatus) => row.is_carried ?
                <Badge variant="outline">نعم</Badge> :
                <Badge variant="secondary">لا</Badge>
        },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <BookCheck className="h-6 w-6 text-primary" />
                        إدارة نتائج الطلاب
                    </h1>
                    <p className="text-muted-foreground">تسجيل وتحديث نتائج الطلاب في المواد</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>اختيار الطالب</CardTitle>
                        <CardDescription>اختر الطالب والسنة الدراسية لعرض/تعديل نتائجه</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>بحث عن طالب</Label>
                                <Input
                                    placeholder="اسم الطالب..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>الطالب</Label>
                                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="اختر الطالب" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {studentsData?.map((student) => (
                                            <SelectItem key={student.id} value={student.id}>
                                                {student.name} - {student.department?.name} ({student.stage?.name})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>السنة الدراسية</Label>
                                <Select value={academicYear} onValueChange={setAcademicYear}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="اختر السنة الدراسية" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 6 }, (_, i) => {
                                            const y = new Date().getFullYear() - 2 + i;
                                            const val = `${y}-${y + 1}`;
                                            return <SelectItem key={val} value={val}>{val}</SelectItem>;
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {selectedStudentId && academicYear && enrollmentsData?.length === 0 && (
                            <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-lg mt-4">
                                <div>
                                    <h4 className="font-bold text-primary flex items-center gap-2">
                                        <CheckCircle2 className="h-5 w-5" />
                                        المواد المتاحة: {relevantMaterials.length} مادة
                                    </h4>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        لم يتم رصد درجات لهذا الطالب بعد. اضغط لاستيراد مواد مرحلة الطالب ({selectedStudent?.stage?.name}) الحالية.
                                    </p>
                                </div>
                                <Button onClick={handleEnrollAll} disabled={bulkCreateMutation.isPending || relevantMaterials.length === 0}>
                                    {bulkCreateMutation.isPending ? "جاري الاستيراد..." : "استيراد مواد المرحلة"}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {selectedStudentId && enrollmentsData && enrollmentsData.length > 0 && (
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>نتائج المواد</CardTitle>
                                    <CardDescription>حدد نتيجة كل مادة للطالب</CardDescription>
                                </div>
                                <Button
                                    onClick={handleSaveAll}
                                    disabled={bulkUpdateMutation.isPending}
                                    className="gradient-primary"
                                >
                                    <Save className="h-4 w-4 ml-2" />
                                    {bulkUpdateMutation.isPending ? "جاري الحفظ..." : "حفظ جميع التغييرات"}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <LoadingSpinner />
                            ) : (
                                <>
                                    <div className="grid grid-cols-4 gap-4 mb-4">
                                        <div className="p-4 bg-success/10 rounded-lg">
                                            <div className="text-sm text-muted-foreground">ناجح</div>
                                            <div className="text-2xl font-bold text-success">
                                                {enrollments.filter(e => (e.newStatus || e.result_status) === 'PASSED').length}
                                            </div>
                                        </div>
                                        <div className="p-4 bg-destructive/10 rounded-lg">
                                            <div className="text-sm text-muted-foreground">راسب</div>
                                            <div className="text-2xl font-bold text-destructive">
                                                {enrollments.filter(e => (e.newStatus || e.result_status) === 'FAILED').length}
                                            </div>
                                        </div>
                                        <div className="p-4 bg-warning/10 rounded-lg">
                                            <div className="text-sm text-muted-foreground">محجوب</div>
                                            <div className="text-2xl font-bold text-warning">
                                                {enrollments.filter(e => (e.newStatus || e.result_status) === 'BLOCKED_BY_ABSENCE').length}
                                            </div>
                                        </div>
                                        <div className="p-4 bg-muted rounded-lg">
                                            <div className="text-sm text-muted-foreground">قيد الدراسة</div>
                                            <div className="text-2xl font-bold">
                                                {enrollments.filter(e => (e.newStatus || e.result_status) === 'IN_PROGRESS').length}
                                            </div>
                                        </div>
                                    </div>

                                    <Tabs defaultValue="SEMESTER_1" className="w-full">
                                        <TabsList className="grid w-full grid-cols-3 mb-4">
                                            <TabsTrigger value="SEMESTER_1">الفصل الأول ({enrollments.filter(e => e.material?.semester === 'SEMESTER_1').length})</TabsTrigger>
                                            <TabsTrigger value="SEMESTER_2">الفصل الثاني ({enrollments.filter(e => e.material?.semester === 'SEMESTER_2').length})</TabsTrigger>
                                            <TabsTrigger value="FULL_YEAR">سنوي ({enrollments.filter(e => (!e.material?.semester || e.material?.semester === 'FULL_YEAR')).length})</TabsTrigger>
                                        </TabsList>

                                        <div className="grid grid-cols-4 gap-4 mb-4">
                                            <div className="p-4 bg-success/10 rounded-lg">
                                                <div className="text-sm text-muted-foreground">ناجح</div>
                                                <div className="text-2xl font-bold text-success">
                                                    {enrollments.filter(e => (e.newStatus || e.result_status) === 'PASSED').length}
                                                </div>
                                            </div>
                                            <div className="p-4 bg-destructive/10 rounded-lg">
                                                <div className="text-sm text-muted-foreground">راسب</div>
                                                <div className="text-2xl font-bold text-destructive">
                                                    {enrollments.filter(e => (e.newStatus || e.result_status) === 'FAILED').length}
                                                </div>
                                            </div>
                                            <div className="p-4 bg-warning/10 rounded-lg">
                                                <div className="text-sm text-muted-foreground">محجوب</div>
                                                <div className="text-2xl font-bold text-warning">
                                                    {enrollments.filter(e => (e.newStatus || e.result_status) === 'BLOCKED_BY_ABSENCE').length}
                                                </div>
                                            </div>
                                            <div className="p-4 bg-muted rounded-lg">
                                                <div className="text-sm text-muted-foreground">قيد الدراسة</div>
                                                <div className="text-2xl font-bold">
                                                    {enrollments.filter(e => (e.newStatus || e.result_status) === 'IN_PROGRESS').length}
                                                </div>
                                            </div>
                                        </div>

                                        <TabsContent value="SEMESTER_1">
                                            <DataTable
                                                data={enrollments.filter(e => e.material?.semester === 'SEMESTER_1')}
                                                columns={columns}
                                                pageSize={100}
                                            />
                                        </TabsContent>
                                        <TabsContent value="SEMESTER_2">
                                            <DataTable
                                                data={enrollments.filter(e => e.material?.semester === 'SEMESTER_2')}
                                                columns={columns}
                                                pageSize={100}
                                            />
                                        </TabsContent>
                                        <TabsContent value="FULL_YEAR">
                                            <DataTable
                                                data={enrollments.filter(e => !e.material?.semester || e.material?.semester === 'FULL_YEAR')}
                                                columns={columns}
                                                pageSize={100}
                                            />
                                        </TabsContent>
                                    </Tabs>
                                </>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}
