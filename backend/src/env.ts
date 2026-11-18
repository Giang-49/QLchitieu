import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnvFile } from 'node:process';

const file = resolve(__dirname, '../.env');
if (existsSync(file)) loadEnvFile(file);
