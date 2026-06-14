import { PrismaClient } from './generated/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
};

const factory = new PrismaLibSql(config);
const prisma = new PrismaClient({ adapter: factory });

export default prisma;
