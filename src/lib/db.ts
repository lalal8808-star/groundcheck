import { neon } from '@neondatabase/serverless';

export const sql = (strings: TemplateStringsArray, ...values: any[]) => {
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL is missing. SQL query skipped.");
    return Promise.resolve([]);
  }
  const connector = neon(process.env.DATABASE_URL);
  return connector(strings, ...values);
};
