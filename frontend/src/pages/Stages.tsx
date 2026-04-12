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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Pencil, Trash2, Layers } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { stagesApi, Stage as StageType } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Interface removed, imported from API

// Demo data removed

export default function Stages() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<StageType | null>(null);

  // 1. Fetch
  const { data, isLoading } = useQuery({
    queryKey: ['stages'],
    queryFn: async () => {
      const response = await stagesApi.getAll();
      return response.data?.stages || [];
    }
  });

  // 2. Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => stagesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stages'] });
      toast({ title: "تمت إضافة المرحلة بنجاح" });
      setIsDialogOpen(false);
      setEditingStage(null);
    },
    onError: (error: Error) => {
      toast({ title: "فشل إضافة المرحلة", description: error.message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => stagesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stages'] });
      toast({ title: "تم حذف المرحلة بنجاح", variant: "destructive" });
    },
    onError: (error: Error) => {
      toast({ title: "فشل حذف المرحلة", description: error.message, variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const name = formData.get("name") as string;
    const level = Number(formData.get("level"));

    // API Mapping: Stage Create.
    const payload = {
      name,
      level
    };

    if (editingStage) {
      // Update logic if exists, else toast
      toast({ title: "عذراً، تعديل المراحل غير مدعوم حالياً", variant: "destructive" });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذه المرحلة؟")) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (stage: StageType) => {
    setEditingStage(stage);
    setIsDialogOpen(true);
  };

  const columns = [
    { key: "name", header: "اسم المرحلة" },
    {
      key: "level",
      header: "المستوى",
      render: (stage: StageType) => (
        <Badge variant="outline">المستوى {stage.level}</Badge>
      )
    },
    // { 
    //   key: "studentsCount", 
    //   header: "الطلاب",
    //   render: (stage: StageType) => (
    //     <Badge variant="secondary">{stage.studentsCount || 0} طالب</Badge>
    //   )
    // },
    // { 
    //   key: "materialsCount", 
    //   header: "المواد",
    //   render: (stage: StageType) => (
    //     <Badge>{stage.materialsCount || 0} مادة</Badge>
    //   )
    // },
    {
      key: "actions",
      header: "الإجراءات",
      render: (stage: StageType) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEdit(stage)}>
              <Pencil className="h-4 w-4 ms-2" />
              تعديل
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => handleDelete(stage.id)}
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
              <Layers className="h-6 w-6 text-primary" />
              المراحل الدراسية
            </h1>
            <p className="text-muted-foreground">إدارة المراحل الدراسية</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingStage(null);
          }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary">
                <Plus className="h-4 w-4 ms-2" />
                إضافة مرحلة
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingStage ? "تعديل المرحلة" : "إضافة مرحلة جديدة"}
                </DialogTitle>
                <DialogDescription>
                  {editingStage ? "قم بتعديل البيانات" : "أدخل بيانات المرحلة الجديدة"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>اسم المرحلة</Label>
                    <Input
                      name="name"
                      defaultValue={editingStage?.name}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>المستوى</Label>
                    <Input
                      name="level"
                      type="number"
                      min="1"
                      defaultValue={editingStage?.level || 1}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit" className="gradient-primary" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "جاري الحفظ..." : (editingStage ? "حفظ التغييرات" : "إضافة")}
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
          searchPlaceholder="بحث عن مرحلة..."
        />
      </div>
    </DashboardLayout>
  );
}
