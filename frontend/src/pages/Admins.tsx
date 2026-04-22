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
import { ShieldCheck, Plus, UserPlus, MoreHorizontal, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, departmentsApi, Admin } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function Admins() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("all");

  const { data: adminsData, isLoading: isLoadingAdmins } = useQuery({
    queryKey: ['admins'],
    queryFn: async () => {
      const response = await adminApi.getAllAdmins();
      return response.data?.admins || [];
    }
  });

  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await departmentsApi.getAll();
      return response.data?.departments || [];
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => adminApi.createAdmin(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      toast({ title: "تم إنشاء حساب رئيس القسم بنجاح" });
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "فشل إنشاء الحساب", description: error.message, variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminApi.updateAdmin(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      toast({ title: "تم تحديث بيانات الحساب بنجاح" });
      setIsDialogOpen(false);
      setEditingAdmin(null);
    },
    onError: (error: Error) => {
      toast({ title: "فشل تحديث الحساب", description: error.message, variant: "destructive" });
    }
  });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const baseData = {
      name,
      email,
      departmentId: selectedDepartmentId === "all" ? undefined : selectedDepartmentId,
      password: password || undefined
    };

    if (editingAdmin) {
      updateMutation.mutate({ id: editingAdmin.id, data: baseData });
    } else {
      createMutation.mutate(baseData);
    }
  };

  const handleEdit = (admin: Admin) => {
    setEditingAdmin(admin);
    setSelectedDepartmentId(admin.department_id || "all");
    setIsDialogOpen(true);
  };

  const columns = [
    { key: "name", header: "الاسم" },
    { key: "email", header: "البريد الإلكتروني" },
    { 
      key: "department", 
      header: "القسم المسند", 
      render: (a: Admin) => a.department?.name || <span className="text-primary font-bold">مدير نظام (عميد)</span>
    },
    { 
      key: "role", 
      header: "الصلاحية", 
      render: (a: Admin) => a.department_id ? "رئيس قسم" : "مدير عام"
    },
    {
      key: "actions",
      header: "الإجراءات",
      render: (admin: Admin) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEdit(admin)}>
              <Pencil className="h-4 w-4 ms-2" />
              تعديل البيانات
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  if (isLoadingAdmins) return <LoadingSpinner />;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              مدراء النظام ورؤساء الأقسام
            </h1>
            <p className="text-muted-foreground">إدارة حسابات مدراء النظام ورؤساء الأقسام</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingAdmin(null);
              setSelectedDepartmentId("all");
            }
          }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary">
                <UserPlus className="h-4 w-4 ms-2" />
                إنشاء حساب جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingAdmin ? "تعديل بيانات الحساب" : "إضافة مدير / رئيس قسم"}</DialogTitle>
                <DialogDescription>
                  {editingAdmin ? "قم بتحديث بيانات المسؤول." : "قم بإنشاء حساب جديد وتعيينه لقسم محدد أو كمدير عام."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={onSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>الاسم الكامل</Label>
                    <Input 
                      name="name" 
                      placeholder="مثال: د. محمد علي" 
                      defaultValue={editingAdmin?.name} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>البريد الإلكتروني</Label>
                    <Input 
                      name="email" 
                      type="email" 
                      placeholder="example@univ.edu.iq" 
                      defaultValue={editingAdmin?.email} 
                      required 
                      dir="ltr" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>كلمة المرور</Label>
                    <Input 
                      name="password" 
                      type="password" 
                      placeholder={editingAdmin ? "اتركه فارغاً للحفاظ على الحالية" : "اتركه فارغاً للتوليد التلقائي"} 
                      dir="ltr" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>القسم المسند</Label>
                    <Select 
                      name="departmentId" 
                      value={selectedDepartmentId} 
                      onValueChange={setSelectedDepartmentId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر القسم" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">مدير عام (عميد الكلية)</SelectItem>
                        {departmentsData?.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      اختيار "مدير عام" يمنح صلاحيات على كافة الأقسام.
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit" className="gradient-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                    {createMutation.isPending || updateMutation.isPending 
                      ? "جاري الحفظ..." 
                      : (editingAdmin ? "حفظ التغييرات" : "إنشاء الحساب")}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <DataTable
          data={adminsData || []}
          columns={columns}
          searchKey="name"
          searchPlaceholder="بحث عن اسم..."
        />
      </div>
    </DashboardLayout>
  );
}
