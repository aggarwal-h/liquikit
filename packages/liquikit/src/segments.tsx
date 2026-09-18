"use client";

import type { CSSProperties, ReactNode } from "react";
import type { OptionBounds } from "./glass";
import type { Segment } from "./types";

export function over(bounds: OptionBounds[], index: number): CSSProperties {
	return { left: bounds[index]?.left ?? 0, width: bounds[index]?.width ?? 0 };
}

export function Name({ segment }: { segment: Segment }): ReactNode {
	return <span className="glass-segmented__hit-label">{segment.label}</span>;
}

export function indicesOf(segments: Segment[], values: readonly unknown[]) {
	return segments.reduce<number[]>((all, segment, index) => {
		if (values.includes(segment.value)) all.push(index);
		return all;
	}, []);
}
