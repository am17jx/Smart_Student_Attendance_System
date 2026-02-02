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
import { Plus, MoreHorizontal, Pencil, Trash2, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { materialsApi, departmentsApi, stagesApi, Material as MaterialType } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Interface removed, imported from API

// Demo data removed
const departments = []; // Removed placeholders
const stages = []; // Removed placeholders

export default function Materials() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialType | null>(null);

  // 1. Fetch
  // 1. Fetch
  const { data: materialsData, isLoading: isLoadingMaterials } = useQuery({
    queryKey: ['materials'],
    queryFn: async () => {
      const response = await materialsApi.getAll();
      return response.data?.materials || [];
    }
  });

  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await departmentsApi.getAll();
      return response.data?.departments || [];
    }
  });

  const { data: stagesData } = useQuery({
    queryKey: ['stages'],
    queryFn: async () => {
      const response = await stagesApi.getAll();
      return response.data?.stages || [];
    }
  });

  // 2. Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => materialsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast({ title: "تمت إضافة المادة بنجاح" });
      setIsDialogOpen(false);
      setEditingMaterial(null);
    },
    onError: (error: Error) => {
      toast({ title: "فشل إضافة المادة", description: error.message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => materialsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast({ title: "تم حذف المادة بنجاح", variant: "destructive" });
    },
    onError: (error: Error) => {
      toast({ title: "فشل حذف المادة", description: error.message, variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => materialsApi.update(data.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast({ title: "تم تحديث المادة بنجاح" });
      setIsDialogOpen(false);
      setEditingMaterial(null);
    },
    onError: (error: Error) => {
      toast({ title: "فشل تحديث المادة", description: error.message, variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // API Mapping: Material Create usually needs name, departmentId, stageId.
    // We have strings for now.
    const name = formData.get("name") as string;
    const departmentId = formData.get("departmentId") as string;
    const stageId = formData.get("stageId") as string;
    const semester = formData.get("semester") as string;

    const payload = {
      name,
      departmentId,
      stageId,
      semester
    };

    if (editingMaterial) {
      updateMutation.mutate({ ...payload, id: editingMaterial.id });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذه المادة؟")) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (material: MaterialType) => {
    setEditingMaterial(material);
    setIsDialogOpen(true);
  };

  const columns = [
    { key: "name", header: "اسم المادة" },
    { key: "department", header: "القسم", render: (m: MaterialType) => m.department?.name || "N/A" },
    { key: "stage", header: "المرحلة", render: (m: MaterialType) => m.stage?.name || "N/A" },
    {
      key: "semester",
      header: "الفصل الدراسي",
      render: (m: MaterialType) => {
        const map = { 'SEMESTER_1': 'الفصل الأول', 'SEMESTER_2': 'الفصل الثاني', 'FULL_YEAR': 'سنوي' };
        return map[m.semester as keyof typeof map] || 'سنوي';
      }
    },
    {
      key: "teachersCount",
      header: "المعلمين",
      render: (material: MaterialType) => (
        <Badge variant="secondary">{(material as any).teachersCount || 0}</Badge>
      )
    },
    // { 
    //   key: "studentsCount", 
    //   header: "الطلاب",
    //   render: (material: MaterialType) => (
    //     <Badge variant="outline">{material.studentsCount || 0}</Badge>
    //   )
    // },
    {
      key: "actions",
      header: "الإجراءات",
      render: (material: MaterialType) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEdit(material)}>
              <Pencil className="h-4 w-4 ms-2" />
              تعديل
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => handleDelete(material.id)}
            >
              <Trash2 className="h-4 w-4 ms-2" />
              حذف
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  if (isLoadingMaterials) return <LoadingSpinner />;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              المواد الدراسية
            </h1>
            <p className="text-muted-foreground">إدارة المواد الدراسية في النظام</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingMaterial(null);
          }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary">
                <Plus className="h-4 w-4 ms-2" />
                إضافة مادة
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingMaterial ? "تعديل المادة" : "إضافة مادة جديدة"}
                </DialogTitle>
                <DialogDescription>
                  {editingMaterial ? "قم بتعديل البيانات" : "أدخل بيانات المادة الجديدة"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>اسم المادة</Label>
                    <Input
                      name="name"
                      defaultValue={editingMaterial?.name}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>القسم</Label>
                      <Select name="departmentId" defaultValue={editingMaterial?.department_id} required>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر القسم" />
                        </SelectTrigger>
                        <SelectContent>
                          {departmentsData?.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>المرحلة</Label>
                      <Select name="stageId" defaultValue={editingMaterial?.stage_id} required>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المرحلة" />
                        </SelectTrigger>
                        <SelectContent>
                          {stagesData?.map((stage) => (
                            <SelectItem key={stage.id} value={stage.id}>
                              {stage.name} - المستوى {stage.level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>الفصل الدراسي</Label>
                    <Select name="semester" defaultValue={editingMaterial?.semester || 'FULL_YEAR'} required>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الفصل الدراسي" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FULL_YEAR">سنوي (كامل السنة)</SelectItem>
                        <SelectItem value="SEMESTER_1">الفصل الأول (الكورس الأول)</SelectItem>
                        <SelectItem value="SEMESTER_2">الفصل الثاني (الكورس الثاني)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit" className="gradient-primary" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "جاري الحفظ..." : (editingMaterial ? "حفظ التغييرات" : "إضافة")}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <DataTable
          data={materialsData || []}
          columns={columns}
          searchKey="name"
          searchPlaceholder="بحث عن مادة..."
        />
      </div>
    </DashboardLayout>
  );
}
