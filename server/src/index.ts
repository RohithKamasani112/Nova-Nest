import { app } from './app';
import { env } from './env';

app.listen(env.port, () => {
  console.log(`[crm-server] listening on http://localhost:${env.port} (${env.nodeEnv})`);
});
