import { SegmentedControl } from "@liquikit/react";
import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

export const MANAGERS = ["pnpm", "npm", "yarn", "bun"] as const;
export type Manager = (typeof MANAGERS)[number];

const RUNNERS: Record<Manager, string> = {
	pnpm: "pnpm dlx",
	npm: "npx",
	yarn: "yarn dlx",
	bun: "bunx --bun",
};

const INSTALLERS: Record<Manager, string> = {
	pnpm: "pnpm add",
	npm: "npm install",
	yarn: "yarn add",
	bun: "bun add",
};

export function run(manager: Manager, command: string) {
	return `${RUNNERS[manager]} ${command}`;
}

export function install(manager: Manager, packages: string[]) {
	return `${INSTALLERS[manager]} ${packages.join(" ")}`;
}

const KEY = "liquikit-package-manager";
const Context = createContext<{
	manager: Manager;
	setManager: (manager: Manager) => void;
} | null>(null);

export function PackageManagerProvider({ children }: { children: ReactNode }) {
	const [manager, setManager] = useState<Manager>("pnpm");
	useEffect(() => {
		try {
			const saved = localStorage.getItem(KEY);
			if (saved && (MANAGERS as readonly string[]).includes(saved)) {
				setManager(saved as Manager);
			}
		} catch {}
	}, []);
	const value = useMemo(
		() => ({
			manager,
			setManager: (next: Manager) => {
				setManager(next);
				try {
					localStorage.setItem(KEY, next);
				} catch {}
			},
		}),
		[manager],
	);
	return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function usePackageManager() {
	const value = useContext(Context);
	if (!value)
		throw new Error("usePackageManager needs a PackageManagerProvider");
	return value;
}

export function ManagerPicker() {
	const { manager, setManager } = usePackageManager();
	return (
		<SegmentedControl
			options={[...MANAGERS]}
			value={manager}
			onValueChange={(value) => setManager(value as Manager)}
			height={32}
			aria-label="Package manager"
		/>
	);
}
