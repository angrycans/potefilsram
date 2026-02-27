import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.potefilsram.app",
  appName: "Potefilsram",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
};

export default config;
