import { copyFileSync, cpSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const distDir = 'dist';

// Clean and create dist directory
if (existsSync(distDir)) {
    cpSync(distDir, distDir + '_backup', { recursive: true, force: true });
}
mkdirSync(distDir, { recursive: true });

// Copy source files to dist
cpSync('src', join(distDir), { recursive: true });

// Copy Prisma schema
mkdirSync(join(distDir, 'prisma'), { recursive: true });
copyFileSync('prisma/schema.prisma', join(distDir, 'prisma/schema.prisma'));

console.log('Build completed successfully!');
