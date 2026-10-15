import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.letscollab.app',
  appName: 'LetsCollab',
  webDir: 'public',
  server: {
    // When deploying, point to your Vercel URL (e.g. https://letscollab.vercel.app)
    // or your local machine's IP (e.g. http://192.168.1.X:3000) for hot reload
    url: process.env.CAPACITOR_SERVER_URL,
    cleartext: true,
  },
};

export default config;
