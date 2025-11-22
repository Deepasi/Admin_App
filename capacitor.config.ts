// import type { CapacitorConfig } from '@capacitor/cli';

// const config: CapacitorConfig = {
//   appId: 'com.SCRagrofarm.Farmapp',
//   appName: 'SCR agro farm',
//   webDir: 'dist'
// };

// export default config;
// // P



import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.scrfarms.app',
  appName: 'SCR Agro Farms',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      showSpinner: false
    }
  }
};

export default config;