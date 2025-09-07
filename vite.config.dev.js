import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig(({ command }) => {
  const isServe = command === 'serve';
  
  return {
    plugins: [react()],
    server: {
      port: 3000,
      open: true,
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
      rollupOptions: {
        input: isServe ? resolve(__dirname, "index.html") : resolve(__dirname, "src/main.tsx"),
        output: isServe ? {} : {
          entryFileNames: "index.js",
          assetFileNames: "index.[ext]",
        },
      },
    },
  };
});