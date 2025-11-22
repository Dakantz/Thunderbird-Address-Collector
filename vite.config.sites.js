import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import Vue from "@vitejs/plugin-vue";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [Vue()],

    resolve: {

        alias: {
            "@": fileURLToPath(new URL("./", import.meta.url)),
        },
        extensions: [
            '.js',
            '.json',
            '.jsx',
            '.mjs',
            '.ts',
            '.tsx',
            '.vue',
        ],
    },
    build: {
        minify: true,
        sourcemap: true,
        outDir: "dist-sites",
        rollupOptions: {
            input: {
                appOptions: fileURLToPath(new URL('./options/index.html', import.meta.url)),
            },
            output: {
                dir: "dist/",
            },
        }
    }
});