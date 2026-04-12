declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                role: string;
                [key: string]: any;
            };
            student?: {
                id: bigint;
                name: string;
                email: string;
                student_id: string;
                fingerprint_hash: string | null;
                [key: string]: any;
            };
            teacher?: {
                id: bigint;
                name: string;
                email: string;
                department_id: bigint | null;
                [key: string]: any;
            };
            admin?: {
                id: string;
                email: string;
                role: string;
                [key: string]: any;
            };
        }
    }
}

export { };
