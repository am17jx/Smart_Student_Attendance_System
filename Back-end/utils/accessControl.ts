import logger from './logger';

export interface AdminUser {
    id: bigint;
    email: string;
    department_id: bigint | null;
}

/**
 * Get department filter for database queries based on admin's department
 * @param admin - The authenticated admin user
 * @returns Department filter object or undefined (for Dean = no filter)
 */
export function getDepartmentFilter(admin: AdminUser): { department_id: bigint } | undefined {
    if (!admin) {
        logger.error('getDepartmentFilter: Invalid admin object', { admin });
        throw new Error('Admin data is missing');
    }

    logger.debug('getDepartmentFilter', {
        admin_id: admin.id?.toString(),
        department_id: admin.department_id?.toString()
    });

    // NULL or undefined department_id = Dean (Full Access)
    if (!admin.department_id) {
        logger.debug('Dean detected (department_id=NULL/undefined), no filter applied');
        return undefined;
    }

    // NOT NULL department_id = Department Head (Restricted Access)
    logger.debug('Department Head detected, filtering by department', { department_id: admin.department_id.toString() });
    return { department_id: admin.department_id };
}

/**
 * Check if admin can access a specific department
 * @param admin - The authenticated admin user
 * @param departmentId - The department ID to check access for
 * @returns true if admin has access, false otherwise
 */
export function canAccessDepartment(admin: AdminUser, departmentId: bigint): boolean {
    // Dean has access to all departments
    if (!admin.department_id) {
        return true;
    }

    // Department Head can only access their assigned department
    return admin.department_id === departmentId;
}

/**
 * Validate admin has access to a department, throws error if not
 * @param admin - The authenticated admin user
 * @param departmentId - The department ID to validate access for
 * @throws Error if admin does not have access
 */
export function validateDepartmentAccess(admin: AdminUser, departmentId: bigint): void {
    if (!canAccessDepartment(admin, departmentId)) {
        throw new Error('Access denied: You do not have permission to access this department');
    }
}

/**
 * Get list of department IDs the admin has access to
 * @param admin - The authenticated admin user
 * @returns Array of department IDs (null for Dean = all departments)
 */
export function getAccessibleDepartmentIds(admin: AdminUser): bigint[] | null {
    // Dean has access to all departments
    if (!admin.department_id) {
        return null; // null means all departments
    }

    // Department Head has access to their department only
    return [admin.department_id];
}
