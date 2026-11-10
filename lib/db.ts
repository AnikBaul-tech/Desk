import { neon } from '@neondatabase/serverless';

export const sql = neon(process.env.DATABASE_URL!);
export type Row = Record<string, any>;
