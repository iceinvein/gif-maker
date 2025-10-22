import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react(), tsconfigPaths(), tailwindcss()],
	server: {
		headers: {
			"Cross-Origin-Opener-Policy": "same-origin",
			"Cross-Origin-Embedder-Policy": "require-corp",
		},
	},
	optimizeDeps: {
		exclude: ["@ffmpeg/ffmpeg", "@ffmpeg/util"],
	},
	build: {
		outDir: "dist",
		rollupOptions: {
			output: {
				manualChunks: (path) => {
					const reversedPath = path.split("/").reverse();
					return reversedPath[reversedPath.indexOf("node_modules") - 1];
				},
			},
			onwarn(warning, warn) {
				if (warning.code === "MODULE_LEVEL_DIRECTIVE") return;
				warn(warning);
			},
		},
		chunkSizeWarningLimit: 1600,
	},
});
