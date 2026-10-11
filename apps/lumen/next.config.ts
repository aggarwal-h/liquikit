import type { NextConfig } from "next";

// Static export under /lumen; the site's build copies `out` into its own.
const nextConfig: NextConfig = {
	output: "export",
	basePath: "/lumen",
	turbopack: {
		rules: {
			"*.css": {
				loaders: ["@tailwindcss/turbopack"],
				as: "*.css",
			},
		},
	},
};

export default nextConfig;
