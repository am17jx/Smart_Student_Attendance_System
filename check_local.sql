SELECT 'Admin' as tbl, COUNT(*) FROM "Admin"
UNION ALL SELECT 'Student', COUNT(*) FROM "Student"
UNION ALL SELECT 'Teacher', COUNT(*) FROM "Teacher"
UNION ALL SELECT 'Department', COUNT(*) FROM "Department";
