import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Pencil, Trash2, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { departmentsApi, Department as DepartmentType } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function Departments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<DepartmentType | null>(null);


  const { data, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await departmentsApi.getAll();
      return response.data?.departments || [];
    }
  });


  const createMutation = useMutation({
    mutationFn: (data: { name: string }) => departmentsApi.create(data.name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast({ title: "تمت إضافة القسم بنجاح" });
      setIsDialogOpen(false);
      setEditingDepartment(null);
    },
    onError: (error: Error) => {
      toast({ title: "فشل إضافة القسم", description: error.message, variant: "destructive" });
    }
  });


  const deleteMutation = useMutation({
    mutationFn: (id: string) => departmentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast({ title: "تم حذف القسم بنجاح", variant: "destructive" });
    },
    onError: (error: Error) => {
      toast({ title: "فشل حذف القسم", description: error.message, variant: "destructive" });
    }
  });


  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;

    if (editingDepartment) {
      toast({ title: "عذراً، تعديل الأقسام غير مدعوم حالياً", variant: "destructive" });
    } else {
      createMutation.mutate({ name });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا القسم؟")) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (department: DepartmentType) => {
    setEditingDepartment(department);
    setIsDialogOpen(true);
  };

  const columns = [
    { key: "name", header: "اسم القسم" },

    {
      key: "actions",
      header: "الإجراءات",
      render: (dept: DepartmentType) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEdit(dept)}>
              <Pencil className="h-4 w-4 ms-2" />
              تعديل
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => handleDelete(dept.id)}
            >
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
              <Building2 className="h-6 w-6 text-primary" />
              الأقسام
            </h1>
            <p className="text-muted-foreground">إدارة الأقسام الأكاديمية</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingDepartment(null);
          }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary">
                <Plus className="h-4 w-4 ms-2" />
                إضافة قسم
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingDepartment ? "تعديل القسم" : "إضافة قسم جديد"}
                </DialogTitle>
                <DialogDescription>
                  {editingDepartment ? "قم بتعديل البيانات" : "أدخل اسم القسم الجديد"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>اسم القسم</Label>
                    <Input
                      name="name"
                      defaultValue={editingDepartment?.name}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit" className="gradient-primary" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "جاري الحفظ..." : (editingDepartment ? "حفظ التغييرات" : "إضافة")}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <DataTable
          data={data || []}
          columns={columns}
          searchKey="name"
          searchPlaceholder="بحث عن قسم..."
        />
      </div>
    </DashboardLayout>
  );
}
