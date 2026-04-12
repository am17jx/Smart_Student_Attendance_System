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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plus, MoreHorizontal, Pencil, Trash2, Users, Check, ChevronsUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { teachersApi, departmentsApi, materialsApi, Teacher as TeacherType, Material } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";

export default function Teachers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherType | null>(null);

  // Multi-select state
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);
  const [isMaterialComboboxOpen, setIsMaterialComboboxOpen] = useState(false);

  // القسم المختار للأستاذ (لتصفية المواد)
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");


  const { data: teachersData, isLoading: isLoadingTeachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const response = await teachersApi.getAll();
      return response.data?.teachers || [];
    }
  });


  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await departmentsApi.getAll();
      return response.data?.departments || [];
    }
  });


  const { data: materialsData } = useQuery({
    queryKey: ['materials'],
    queryFn: async () => {
      const response = await materialsApi.getAll();
      return response.data?.materials || [];
    }
  });


  const createMutation = useMutation({
    mutationFn: (data: any) => teachersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast({ title: "تمت إضافة المعلم بنجاح" });
      setIsDialogOpen(false);
      setEditingTeacher(null);
      setSelectedMaterialIds([]);
    },
    onError: (error: Error) => {
      toast({ title: "فشل إضافة المعلم", description: error.message, variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => teachersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast({ title: "تم تحديث بيانات المعلم بنجاح" });
      setIsDialogOpen(false);
      setEditingTeacher(null);
      setSelectedMaterialIds([]);
    },
    onError: (error: Error) => {
      toast({ title: "فشل تحديث المعلم", description: error.message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => teachersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast({ title: "تم حذف المعلم بنجاح", variant: "destructive" });
    },
    onError: (error: Error) => {
      toast({ title: "فشل حذف المعلم", description: error.message, variant: "destructive" });
    }
  });





  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const departmentId = formData.get("departmentId") as string;

    const baseData = {
      name,
      email,
      departmentId: departmentId || undefined,
      materialIds: selectedMaterialIds
    };

    if (editingTeacher) {
      updateMutation.mutate({ id: editingTeacher.id, data: baseData });
    } else {
      createMutation.mutate({ ...baseData, password });
    }
  };


  const handleDelete = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا المعلم؟")) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (teacher: TeacherType) => {
    setEditingTeacher(teacher);

    const currentMaterials = (teacher as any).materials?.map((m: any) => m.id) || [];
    setSelectedMaterialIds(currentMaterials);
    // تعيين قسم الأستاذ المختار
    setSelectedDepartmentId(teacher.department_id || "");
    setIsDialogOpen(true);
  };

  const toggleMaterial = (materialId: string) => {
    setSelectedMaterialIds(prev =>
      prev.includes(materialId)
        ? prev.filter(id => id !== materialId)
        : [...prev, materialId]
    );
  };


  const filteredMaterials = materialsData?.filter(material => {
    if (!selectedDepartmentId) return true;
    return material.department_id === selectedDepartmentId;
  }) || [];

  const columns = [
    { key: "name", header: "الاسم" },
    { key: "email", header: "البريد الإلكتروني" },
    { key: "department", header: "القسم", render: (t: TeacherType) => t.department?.name || "N/A" },
    {
      key: "materials",
      header: "المواد المسندة",
      render: (t: TeacherType) => {
        const mats = (t as any).materials || [];
        if (mats.length === 0) return <span className="text-muted-foreground text-xs">لا يوجد</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {mats.map((m: any) => (
              <Badge key={m.id} variant="secondary" className="text-xs">{m.name}</Badge>
            ))}
          </div>
        );
      }
    },
    {
      key: "actions",
      header: "الإجراءات",
      render: (teacher: TeacherType) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEdit(teacher)}>
              <Pencil className="h-4 w-4 ms-2" />
              تعديل
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => handleDelete(teacher.id)}
            >
              <Trash2 className="h-4 w-4 ms-2" />
              حذف
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  if (isLoadingTeachers) return <LoadingSpinner />;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              المعلمين
            </h1>
            <p className="text-muted-foreground">إدارة المعلمين في النظام</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingTeacher(null);
              setSelectedMaterialIds([]);
              setSelectedDepartmentId("");
            } else if (!editingTeacher) {

              const adminDeptId = JSON.parse(localStorage.getItem('user') || '{}').department_id;
              if (adminDeptId) {
                setSelectedDepartmentId(adminDeptId);
              }
            }
          }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary">
                <Plus className="h-4 w-4 ms-2" />
                إضافة معلم
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingTeacher ? "تعديل بيانات المعلم" : "إضافة معلم جديد"}
                </DialogTitle>
                <DialogDescription>
                  {editingTeacher ? "قم بتعديل البيانات" : "أدخل بيانات المعلم الجديد"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={onSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>الاسم</Label>
                    <Input
                      name="name"
                      defaultValue={editingTeacher?.name}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>البريد الإلكتروني</Label>
                    <Input
                      name="email"
                      type="email"
                      defaultValue={editingTeacher?.email}
                      required
                      dir="ltr"
                    />
                  </div>
                  {!editingTeacher && (
                    <div className="space-y-2">
                      <Label>كلمة المرور</Label>
                      <Input name="password" type="password" required dir="ltr" />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>القسم</Label>
                    <Select
                      name="departmentId"
                      value={selectedDepartmentId}
                      onValueChange={(value) => {
                        setSelectedDepartmentId(value);
                        // إعادة تعيين المواد المختارة عند تغيير القسم
                        setSelectedMaterialIds([]);
                      }}
                      disabled={!!JSON.parse(localStorage.getItem('user') || '{}').department_id}
                    >
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
                    {JSON.parse(localStorage.getItem('user') || '{}').department_id && (
                      <p className="text-xs text-muted-foreground">
                        كرئيس قسم، يمكنك إنشاء معلمين فقط في قسمك
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>المواد المسندة</Label>
                    <Popover open={isMaterialComboboxOpen} onOpenChange={setIsMaterialComboboxOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={isMaterialComboboxOpen}
                          className="w-full justify-between h-auto min-h-[40px]"
                        >
                          {selectedMaterialIds.length > 0
                            ? <div className="flex flex-wrap gap-1">
                              {selectedMaterialIds.map(id => {
                                const mat = materialsData?.find(m => m.id === id);
                                return mat ? <Badge key={id} variant="secondary" className="mr-1">{mat.name}</Badge> : null;
                              })}
                            </div>
                            : "اختر المواد..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="بحث عن مادة..." />
                          <CommandList>
                            <CommandEmpty>لم يتم العثور على مواد.</CommandEmpty>
                            <CommandGroup>
                              {filteredMaterials.length === 0 ? (
                                <div className="py-6 text-center text-sm text-muted-foreground">
                                  {selectedDepartmentId
                                    ? "لا توجد مواد لهذا القسم. يرجى اختيار قسم أولاً."
                                    : "يرجى اختيار القسم أولاً لعرض المواد المتاحة."}
                                </div>
                              ) : (
                                filteredMaterials.map((material) => (
                                  <CommandItem
                                    key={material.id}
                                    value={material.name}
                                    onSelect={() => toggleMaterial(material.id)}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedMaterialIds.includes(material.id) ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {material.name}
                                    <span className="text-muted-foreground text-xs mr-2">
                                      ({material.stage?.name || 'كل المراحل'})
                                    </span>
                                  </CommandItem>
                                ))
                              )}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit" className="gradient-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                    {createMutation.isPending || updateMutation.isPending ? "جاري الحفظ..." : (editingTeacher ? "حفظ التغييرات" : "إضافة")}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <DataTable
          data={teachersData || []}
          columns={columns}
          searchKey="name"
          searchPlaceholder="بحث عن معلم..."
        />
      </div>
    </DashboardLayout>
  );
}

