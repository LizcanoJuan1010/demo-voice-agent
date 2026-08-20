import path from 'node:path';
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

function resolveUrl(url: string): string {
  if (url.startsWith('file:')) {
    const filePath = url.slice('file:'.length);
    if (!path.isAbsolute(filePath)) {
      return `file:${path.resolve(process.cwd(), filePath)}`;
    }
  }
  return url;
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: resolveUrl(process.env.DATABASE_URL ?? 'file:./prisma/dev.db'),
  },
});
