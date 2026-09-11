"use client";

import { createContext, type ReactNode, useContext } from "react";
import type { GlassTheme } from "./presets";
import "./glass.css";

const GlassThemeContext = createContext<GlassTheme>("light");

export function useGlassTheme(theme?: GlassTheme): GlassTheme {
	const inherited = useContext(GlassThemeContext);
	return theme ?? inherited;
}

export type GlassThemeProviderProps = {
	theme: GlassTheme;
	children?: ReactNode;
};

export function GlassThemeProvider({
	theme,
	children,
}: GlassThemeProviderProps) {
	return (
		<GlassThemeContext.Provider value={theme}>
			<div className="glass-theme" data-glass-theme={theme}>
				{children}
			</div>
		</GlassThemeContext.Provider>
	);
}
