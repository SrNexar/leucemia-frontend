import { mkdir, writeFile } from 'node:fs/promises';

const apiUrl = process.env.API_URL || 'http://localhost:5000';
const environmentDirectory = new URL('../src/environments/', import.meta.url);
const environment = `export const environment = {
  apiUrl: '${apiUrl.replace(/'/g, "\\'")}',
};
`;

await mkdir(environmentDirectory, { recursive: true });
await writeFile(new URL('environment.ts', environmentDirectory), environment);
await writeFile(new URL('environment.development.ts', environmentDirectory), environment);
