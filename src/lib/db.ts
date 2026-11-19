import { neon } from "@neondatabase/serverless";

const dbUrl =
  process.env.NEON_URL ||
  "postgresql://neondb_owner:npg_Yr52PqOuXSsg@ep-long-butterfly-b3ch30as-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

export const sql = neon(dbUrl);
