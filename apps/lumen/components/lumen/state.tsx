"use client";

import {
	createContext,
	type ReactNode,
	useContext,
	useMemo,
	useState,
} from "react";
import { type Finish, SCENES } from "./light";

// One light for every section, so the hero's scene is what the tile shows.
export type Light = {
	on: boolean;
	level: number;
	kelvin: number;
	scene: string;
};

type LumenState = {
	light: Light;
	setOn: (on: boolean) => void;
	setLevel: (level: number) => void;
	setKelvin: (kelvin: number) => void;
	chooseScene: (value: string) => void;
	finish: Finish;
	setFinish: (finish: Finish) => void;
};

const LumenContext = createContext<LumenState | null>(null);

const FIRST = SCENES.find((scene) => scene.value === "evening") ?? SCENES[0];

export function LumenProvider({ children }: { children: ReactNode }) {
	const [light, setLight] = useState<Light>({
		on: true,
		level: FIRST.level,
		kelvin: FIRST.kelvin,
		scene: FIRST.value,
	});
	const [finish, setFinish] = useState<Finish>("silver");

	// Stable setters, so an effect that calls one does not rerun on every change.
	const actions = useMemo(
		() => ({
			setOn: (on: boolean) => setLight((current) => ({ ...current, on })),
			setLevel: (level: number) =>
				setLight((current) => ({ ...current, level, on: true })),
			setKelvin: (kelvin: number) =>
				setLight((current) =>
					current.kelvin === kelvin ? current : { ...current, kelvin },
				),
			chooseScene: (chosen: string) => {
				const scene = SCENES.find((s) => s.value === chosen);
				if (!scene) return;
				setLight({
					on: true,
					level: scene.level,
					kelvin: scene.kelvin,
					scene: scene.value,
				});
			},
			setFinish,
		}),
		[],
	);

	const value = useMemo<LumenState>(
		() => ({ light, finish, ...actions }),
		[light, finish, actions],
	);

	return (
		<LumenContext.Provider value={value}>{children}</LumenContext.Provider>
	);
}

export function useLumen() {
	const state = useContext(LumenContext);
	if (!state) throw new Error("useLumen needs a LumenProvider above it.");
	return state;
}
