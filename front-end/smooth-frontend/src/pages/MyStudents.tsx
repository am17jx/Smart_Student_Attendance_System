import { useQuery } from '@tanstack/react-query';
import { teachersApi } from '../lib/api';
import { Student, Material } from '../lib/api';
import { useState } from 'react';

import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function MyStudents() {
    const [searchQuery, setSearchQuery] = useState('');

    const { data, isLoading, error } = useQuery({
        queryKey: ['my-students'],
        queryFn: teachersApi.getMyStudents,
    });

    const students = data?.data?.students || [];
    const materials = data?.data?.materials || [];

    // Filter students based on search
    const filteredStudents = students.filter((student) =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.student_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Group students by department and stage
    const groupedStudents = filteredStudents.reduce((acc, student) => {
        const key = `${student.department?.name || 'Unknown'} - ${student.stage?.name || 'Unknown'}`;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(student);
        return acc;
    }, {} as Record<string, Student[]>);

    return (
        <DashboardLayout>
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        طلابي 👥
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        كل الطلاب في الأقسام والمراحل الخاصة بموادك
                    </p>
                </div>

                {/* Materials Summary */}
                {materials.length > 0 && (
                    <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                            موادك:
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {materials.map((material) => (
                                <span
                                    key={material.id}
                                    className="px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 rounded-full text-sm"
                                >
                                    {material.name} ({material.department?.name} - {material.stage?.name})
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Search Bar */}
                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="بحث عن طالب (الاسم، الرقم الجامعي، البريد)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {students.length}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            إجمالي الطلاب
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {materials.length}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            المواد المسندة
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {Object.keys(groupedStudents).length}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            الأقسام/المراحل
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <p className="mt-4 text-gray-600 dark:text-gray-400">جاري تحميل الطلاب...</p>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <p className="text-red-800 dark:text-red-200">
                            حدث خطأ في تحميل البيانات. الرجاء المحاولة مرة أخرى.
                        </p>
                    </div>
                )}

                {/* Students List */}
                {!isLoading && !error && (
                    <>
                        {filteredStudents.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <p className="text-gray-600 dark:text-gray-400">
                                    {searchQuery ? 'لا توجد نتائج للبحث' : 'لا يوجد طلاب'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {Object.entries(groupedStudents).map(([group, groupStudents]) => (
                                    <div key={group} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                                        {/* Group Header */}
                                        <div className="bg-gray-100 dark:bg-gray-700 px-6 py-3 border-b border-gray-200 dark:border-gray-600">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {group} ({groupStudents.length} طالب)
                                            </h3>
                                        </div>

                                        {/* Students Table */}
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-gray-50 dark:bg-gray-700/50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                            الاسم
                                                        </th>
                                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                            الرقم الجامعي
                                                        </th>
                                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                            البريد الإلكتروني
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                    {groupStudents.map((student) => (
                                                        <tr
                                                            key={student.id}
                                                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                                        >
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                                    {student.name}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                                                    {student.student_id || '-'}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                                                    {student.email}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}
