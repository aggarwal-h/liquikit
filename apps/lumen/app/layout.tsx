import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import { GlassThemeProvider } from "@/components/liquikit/glass";
import { ToastProvider, ToastViewport } from "@/components/liquikit/toast";
import "./globals.css";

// Inter stands in for San Francisco off Apple devices.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
	title: "Lumen",
	description:
		"Light that keeps time with you. A demo product page built with LiquiKit.",
	formatDetection: { telephone: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en" className={inter.variable}>
			<body className="lumen">
				<GlassThemeProvider theme="dark">
					<ToastProvider>
						{children}
						<ToastViewport />
					</ToastProvider>
				</GlassThemeProvider>
			</body>
		</html>
	);
}
