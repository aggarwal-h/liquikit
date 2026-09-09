"use client";

import { useMemo } from "react";
import type { LensProfile } from "./optics";

export type GlassTheme = "light" | "dark";

export const defaultLens: LensProfile = {
	mapSize: 1024,
	ior: 1.52,
	dispersion: 0.04,
	thickness: 8.5,
	base: 0,
	bevel: 4,
	bevelProfile: 2,
	maxSlope: 6,
	magnification: 1.1,
	domeLength: 1,
	softness: 1,
	environment: 1.4,
	rimLight: 0.55,
	rimShadow: 0.12,
	roughness: 0.28,
	specularStrength: 0.8,
	backLight: 0.45,
	lightAngle: 115,
	lightElevation: 30,
	shadingStrength: 0.9,
	openTint: 0,
	edgeShadow: "0 2px 6px rgba(0, 0, 0, 0.16)",
	edgeInsetShadow: "none",
	restEdgeShadow:
		"0 1.5px 4px rgba(0, 0, 0, 0.14), 0 0 1px rgba(0, 0, 0, 0.06)",
};

export const switchLens: LensProfile = {
	...defaultLens,
	thickness: 14,
	bevel: 8,
	bevelProfile: 3,
	dispersion: 0.2,
	magnification: 0.78,
};

export const sliderLens: LensProfile = {
	...defaultLens,
	thickness: 6,
	base: 32,
	bevel: 10,
	bevelProfile: 4,
	maxSlope: 4,
	magnification: 1,
	dispersion: 0,
	openTint: 0.1,
	edgeShadow: "0 3px 14px rgba(0, 0, 0, 0.1)",
	restEdgeShadow: "0 1.333px 5.333px rgba(0, 0, 0, 0.18)",
};

export const toggleLens: LensProfile = {
	...defaultLens,
	thickness: 6.4,
	base: 14,
	bevel: 10.7,
	bevelProfile: 4,
	maxSlope: 4,
	magnification: 1,
	dispersion: 0,
	openTint: 0.1,
	edgeShadow: "0 3px 14px rgba(0, 0, 0, 0.1)",
	restEdgeShadow:
		"0 3px 8px rgba(0, 0, 0, 0.12), 0 1px 1px rgba(0, 0, 0, 0.04)",
};

export const paneLens: LensProfile = {
	...defaultLens,
	thickness: 5,
	base: 8,
	bevel: 7,
	bevelProfile: 4,
	maxSlope: 4,
	magnification: 1,
	dispersion: 0,
	rimLight: 0.8,
	edgeShadow: "0 8px 24px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.08)",
	edgeInsetShadow: "none",
	restEdgeShadow: "none",
};

export const darkLens: Partial<LensProfile> = {
	environment: 1.2,
	specularStrength: 1.1,
	shadingStrength: 1.1,
	edgeShadow: "0 2px 6px rgba(0, 0, 0, 0.36)",
	edgeInsetShadow: "none",
};

export function useLens(
	theme: GlassTheme = "light",
	overrides?: Partial<LensProfile>,
	base: LensProfile = defaultLens,
): LensProfile {
	return useMemo<LensProfile>(
		() => ({
			...base,
			...(theme === "dark" ? darkLens : undefined),
			...overrides,
		}),
		[base, theme, overrides],
	);
}
