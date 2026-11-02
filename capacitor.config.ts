import type { CapacitorConfig } from '@capacitor/cli';

const appUrl = process.env.APP_URL?.trim();

const config: CapacitorConfig = {
  appId: 'com.jarbol.kingdomwars',
  appName: 'Kingdom Wars',
  webDir: 'capacitor-web',
  server: appUrl
    ? {
        // The game is a server-rendered TanStack Start app, so the Android
        // shell loads its deployed HTTPS website instead of pretending that
        // the server application is a static bundle.
        url: appUrl,
        cleartext: false,
      }
    : undefined,
  android: {
    allowMixedContent: false,
  },
};

export default config;
