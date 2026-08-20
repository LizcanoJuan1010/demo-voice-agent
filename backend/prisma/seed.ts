import path from 'node:path';
import 'dotenv/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../src/generated/prisma/client';

function resolveDatabaseUrl(url: string): string {
  if (url.startsWith('file:')) {
    const filePath = url.slice('file:'.length);
    if (!path.isAbsolute(filePath)) {
      return `file:${path.resolve(process.cwd(), filePath)}`;
    }
  }
  return url;
}

const url = resolveDatabaseUrl(
  process.env.DATABASE_URL ?? 'file:./prisma/dev.db',
);

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url }),
  });

  const account = await prisma.account.upsert({
    where: { accountNumber: 'CH-7723849' },
    update: {},
    create: {
      consumerName: 'James Carter',
      accountNumber: 'CH-7723849',
      cardLastFour: '3849',
      creditor: 'Chase Card Services',
      balanceOwedCents: 384722,
      daysPastDue: 60,
      minimumPaymentCents: 9450,
      pastDueAmountCents: 18900,
      monthlyPaymentCents: 9450,
    },
  });

  console.log('Cuenta sembrada:', account.consumerName, account.accountNumber);
  await prisma.$disconnect();
}

void main();
