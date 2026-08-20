import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    // TanStack Start plugin must run before React's plugin.
    //
    // Deployed to Vercel as a Node serverless function plus static client
    // assets. Rendering happens on the server per request, so site code must
    // be SSR-safe: never touch browser-only globals (window, document,
    // localStorage) during render or at module top level — only inside
    // effects/handlers, or guarded with `typeof window !== "undefined"`.
    tanstackStart(),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
});
