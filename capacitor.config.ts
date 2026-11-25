import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.talkora.app',
  appName: 'Talkora',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
  },
};

export default config;
