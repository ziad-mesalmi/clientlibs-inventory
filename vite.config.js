import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:4502",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, "/bin/myaemproject"),
        configure: (proxy, options) => {
          proxy.on("proxyReq", (proxyReq) => {
            const auth = Buffer.from("admin:admin").toString("base64");
            proxyReq.setHeader("Authorization", `Basic ${auth}`);
          });
        },
      },
    },
  },
});
