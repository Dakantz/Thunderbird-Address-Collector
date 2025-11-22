import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
        },
    },
    build: {
        minify: true,
        sourcemap: true,
        outDir: "dist-background",
        lib: {
            entry: path.resolve(__dirname, 'background/background.ts'),
            name: 'BackgroundScript',
            fileName: (format) => `background-script.${format}.js`
        }
    }
});