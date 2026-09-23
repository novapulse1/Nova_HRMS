import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.novapulse.hrms',
  appName: 'NovaPulse HRMS',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#3b0764',
      showSpinner: true,
      spinnerColor: '#c084fc',
    },
  },
};

export default config;
