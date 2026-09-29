import { Toast } from "@liquikit/react";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DocsShell } from "@/components/docs/layout";
import { PackageManagerProvider } from "@/components/docs/package-manager";
import { NeonProvider } from "@/components/landing/neon";

export const Route = createFileRoute("/docs")({ component: DocsLayout });

function DocsLayout() {
	return (
		<NeonProvider>
			<PackageManagerProvider>
				<Toast.Provider limit={3}>
					<DocsShell>
						<Outlet />
					</DocsShell>
					<Toast.Viewport />
				</Toast.Provider>
			</PackageManagerProvider>
		</NeonProvider>
	);
}
