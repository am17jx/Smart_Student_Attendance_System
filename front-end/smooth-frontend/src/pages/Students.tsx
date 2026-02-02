import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Pencil, Trash2, GraduationCap, Search, Laptop } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  studentsApi,
  departmentsApi,
  stagesApi,
  adminApi,
  Student as StudentType
} from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function Students() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [editingStudent, setEditingStudent] = useState<StudentType | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");


  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isDepartmentHead = !!currentUser.department_id;


  const { data: studentsData, isLoading } = useQuery({
    queryKey: ['students', page, searchQuery],
    queryFn: async () => {
      const response = await studentsApi.getAll(page, 10, searchQuery);
      if (response.data?.meta) {
        setTotalPages(response.data.meta.pages);
      }
      return response.data?.students || [];
    },
    placeholderData: (previousData) => previousData,
  });

  const students = studentsData || [];


  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await departmentsApi.getAll();
      return response.data?.departments || [];
    }
  });


  const userDepartment = departments?.find(d => d.id === currentUser.department_id);


  const { data: stages } = useQuery({
    queryKey: ['stages'],
    queryFn: async () => {
      const response = await stagesApi.getAll();
      return response.data?.stages || [];
    }
  });


  const createMutation = useMutation({
    mutationFn: (data: any) => adminApi.registerStudent(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      // If tempPassword is returned, we could show it, but message says email sent.
      toast({
        title: "تمت إضافة الطالب بنجاح",
        description: data.message || "تم إرسال بريد ترحيبي للطالب"
      });
      setIsDialogOpen(false);
      setEditingStudent(null);
    },
    onError: (error: Error) => {
      toast({ title: "فشل إضافة الطالب", description: error.message, variant: "destructive" });
    }
  });


  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => studentsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast({ title: "تم تحديث بيانات الطالب بنجاح" });
      setIsDialogOpen(false);
      setEditingStudent(null);
    },
    onError: (error: Error) => {
      toast({ title: "فشل تحديث الطالب", description: error.message, variant: "destructive" });
    }
  });


  const deleteMutation = useMutation({
    mutationFn: (id: string) => studentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast({ title: "تم حذف الطالب بنجاح", variant: "destructive" });
    },
    onError: (error: Error) => {
      toast({ title: "فشل حذف الطالب", description: error.message, variant: "destructive" });
    }
  });


  const resetFingerprintMutation = useMutation({
    mutationFn: (id: string) => studentsApi.resetFingerprint(id),
    onSuccess: () => {
      toast({ title: "تم إعادة تعيين بصمة الجهاز بنجاح" });
    },
    onError: (error: Error) => {
      toast({ title: "فشل إعادة تعيين البصمة", description: error.message, variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;


    if (!name || !email) {
      toast({ title: "يرجى ملء جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }

    if (editingStudent) {

      const stageId = formData.get("stageId") as string;
      const departmentId = formData.get("departmentId") as string;

      updateMutation.mutate({
        id: editingStudent.id,
        data: { name, email, stageId, departmentId }
      });
    } else {

      const studentId = formData.get("studentId") as string;
      const stageId = formData.get("stageId") as string;
      const departmentId = formData.get("departmentId") as string;

      if (!studentId || !stageId || !departmentId) {
        toast({ title: "يرجى ملء جميع الحقول بما في ذلك القسم والمرحلة والرقم الجامعي", variant: "destructive" });
        return;
      }

      createMutation.mutate({
        name,
        email,
        studentId,
        stageId,
        departmentId
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا الطالب؟")) {
      deleteMutation.mutate(id);
    }
  };

  const handleResetFingerprint = (id: string) => {
    if (confirm("هل أنت متأكد من إعادة تعيين بصمة الجهاز لهذا الطالب؟")) {
      resetFingerprintMutation.mutate(id);
    }
  };

  const handleEdit = (student: StudentType) => {
    setEditingStudent(student);
    setIsDialogOpen(true);
  };


  const getDeptName = (id?: string) => departments?.find(d => d.id === id)?.name || '-';
  const getStageName = (id?: string) => stages?.find(s => s.id === id)?.name || '-';


  const getAttendanceBadge = (rate: number = 0) => {
    if (rate >= 85) return <Badge className="bg-success text-success-foreground">{rate}%</Badge>;
    if (rate >= 70) return <Badge className="bg-warning text-warning-foreground">{rate}%</Badge>;
    return <Badge variant="destructive">{rate}%</Badge>;
  };

  const columns = [
    { key: "name", header: "الاسم" },
    { key: "email", header: "البريد الإلكتروني" },
    { key: "student_id", header: "الرقم الجامعي" },
    {
      key: "department",
      header: "القسم",
      render: (student: StudentType) => student.department?.name || getDeptName(student.department_id)
    },
    {
      key: "stage",
      header: "المرحلة",
      render: (student: StudentType) => student.stage?.name || getStageName(student.stage_id)
    },
    {
      key: "attendanceRate",
      header: "نسبة الحضور",
      render: (student: StudentType) => {
        const rate = (student as any).attendanceRate;
        return getAttendanceBadge(typeof rate === 'number' ? rate : 0);
      }
    },
    {
      key: "actions",
      header: "الإجراءات",
      render: (student: StudentType) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEdit(student)}>
              <Pencil className="h-4 w-4 ms-2" />
              تعديل
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleResetFingerprint(student.id)}>
              <Laptop className="h-4 w-4 ms-2" />
              إعادة تعيين البصمة
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(student.id)}>
              <Trash2 className="h-4 w-4 ms-2" />
              حذف
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  if (isLoading) return <LoadingSpinner />;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-primary" />
              الطلاب
              {isDepartmentHead && userDepartment && (
                <Badge variant="outline" className="mr-2">
                  {userDepartment.name}
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground">
              {isDepartmentHead ? `إدارة طلاب قسم ${userDepartment?.name || ''}` : 'إدارة الطلاب في النظام'}
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingStudent(null);
          }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary">
                <Plus className="h-4 w-4 ms-2" />
                إضافة طالب
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingStudent ? "تعديل بيانات الطالب" : "إضافة طالب جديد"}
                </DialogTitle>
                <DialogDescription>
                  {editingStudent ? "قم بتعديل البيانات" : "أدخل بيانات الطالب الجديد (سيتم إرسال كلمة المرور عبر البريد)"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>الاسم</Label>
                    <Input name="name" defaultValue={editingStudent?.name} required />
                  </div>

                  <div className="space-y-2">
                    <Label>البريد الإلكتروني</Label>
                    <Input name="email" type="email" defaultValue={editingStudent?.email} required dir="ltr" />
                  </div>

                  {!editingStudent && (
                    <div className="space-y-2">
                      <Label>الرقم الجامعي (Student ID)</Label>
                      <Input name="studentId" required dir="ltr" placeholder="ex: 2023001" />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {isDepartmentHead ? (
                      <div className="space-y-2">
                        <Label>القسم</Label>
                        <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 py-2">
                          <span className="text-sm">{userDepartment?.name}</span>
                        </div>
                        <input type="hidden" name="departmentId" value={currentUser.department_id} />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label>القسم</Label>
                        <Select name="departmentId" defaultValue={editingStudent?.department_id} required>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر القسم" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments?.map((dept) => (
                              <SelectItem key={dept.id} value={dept.id}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>المرحلة</Label>
                      <Select name="stageId" defaultValue={editingStudent?.stage_id} required>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المرحلة" />
                        </SelectTrigger>
                        <SelectContent>
                          {stages?.map((stage) => (
                            <SelectItem key={stage.id} value={stage.id}>
                              {stage.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit" className="gradient-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                    {createMutation.isPending || updateMutation.isPending ? "جاري الحفظ..." : (editingStudent ? "حفظ التغييرات" : "إضافة")}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث عن طالب..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="ps-10"
          />
        </div>

        <DataTable
          data={students}
          columns={columns}
          pageSize={100}
        />

        <div className="flex items-center justify-center gap-2 mt-4">
          <Button
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            السابق
          </Button>
          <span className="text-sm text-muted-foreground">
            صفحة {page} من {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            التالي
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
