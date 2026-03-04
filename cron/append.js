import { appendFile, readFile } from 'fs/promises';

const file = await readFile('cron/job.js', 'utf8');
await appendFile('.svelte-kit/cloudflare/_worker.js', file, 'utf8');
