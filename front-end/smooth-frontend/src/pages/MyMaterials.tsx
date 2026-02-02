import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { materialsApi, Material } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function MyMaterials() {
    const { data: materialsData, isLoading } = useQuery({
        queryKey: ['my-materials'],
        queryFn: async () => {
            const response = await materialsApi.getMyMaterials();
            return response.data?.materials || [];
        }
    });

    const columns = [
        { key: "name", header: "اسم المادة" },
        { key: "department", header: "القسم", render: (m: Material) => m.department?.name || "N/A" },
        { key: "stage", header: "المرحلة", render: (m: Material) => m.stage?.name || "N/A" },
    ];

    if (isLoading) return <LoadingSpinner />;

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <BookOpen className="h-6 w-6 text-primary" />
                            موادي
                        </h1>
                        <p className="text-muted-foreground">المواد المسندة إليك</p>
                    </div>
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
