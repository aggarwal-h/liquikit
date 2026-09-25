import { GlassThemeProvider } from "@liquikit/react";
import {
	type CSSProperties,
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

export const NEONS = [
	{
		name: "blue",
		label: "Electric",
		base: "#2160ff",
		hot: "#a8ccff",
		deep: "#03103f",
	},
	{
		name: "violet",
		label: "Violet",
		base: "#8a5cff",
		hot: "#d6c6ff",
		deep: "#140842",
	},
	{
		name: "pink",
		label: "Pink",
		base: "#ff3d97",
		hot: "#ffc2dd",
		deep: "#3f0622",
	},
	{
		name: "amber",
		label: "Amber",
		base: "#ff8a1f",
		hot: "#ffd2a6",
		deep: "#3d1802",
	},
	{
		name: "mint",
		label: "Mint",
		base: "#1fd68a",
		hot: "#b6f7d9",
		deep: "#02321d",
	},
	{
		name: "cyan",
		label: "Cyan",
		base: "#1cc4ff",
		hot: "#b3ecff",
		deep: "#022f45",
	},
] as const;

export type Neon = (typeof NEONS)[number];

export function neonVars(neon: Neon) {
	return {
		"--neon": neon.base,
		"--neon-hot": neon.hot,
		"--neon-deep": neon.deep,
		"--glass-accent": "var(--neon)",
		"--glass-accent-fill": "color-mix(in oklab, var(--neon) 72%, white)",
	} as CSSProperties;
}

type NeonState = { neon: Neon; setNeon: (neon: Neon) => void };

const Context = createContext<NeonState | null>(null);

export function NeonProvider({ children }: { children: ReactNode }) {
	const [neon, setNeon] = useState<Neon>(NEONS[0]);
	const value = useMemo(() => ({ neon, setNeon }), [neon]);

	useEffect(() => {
		const root = document.documentElement;
		const vars = neonVars(neon) as Record<string, string>;
		for (const [name, color] of Object.entries(vars)) {
			root.style.setProperty(name, color);
		}
		root.style.colorScheme = "dark";
		root.style.background = "#000";
	}, [neon]);

	return (
		<Context.Provider value={value}>
			<GlassThemeProvider theme="dark">
				<div
					className="neon min-h-screen overflow-x-clip bg-black text-white"
					style={neonVars(neon)}
				>
					{children}
				</div>
			</GlassThemeProvider>
		</Context.Provider>
	);
}

export function useNeon() {
	const value = useContext(Context);
	if (!value) throw new Error("useNeon needs a NeonProvider");
	return value;
}
