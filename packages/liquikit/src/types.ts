import type { ReactNode, Ref } from "react";
import type { GlassTheme, LensProfile } from "./glass";

export type GlassOptions = {
	theme?: GlassTheme;
	lens?: Partial<LensProfile>;
	liquid?: number;
};

export type Segment = {
	value: string;
	label: ReactNode;
	disabled?: boolean;
};

export function toSegment(option: string | Segment): Segment {
	return typeof option === "string" ? { value: option, label: option } : option;
}

export function cx(...names: Array<string | false | null | undefined>) {
	return names.filter(Boolean).join(" ");
}

export function mergeRefs<T>(...refs: Array<Ref<T> | undefined>) {
	return (element: T | null) => {
		for (const ref of refs) {
			if (typeof ref === "function") ref(element);
			else if (ref) ref.current = element;
		}
	};
}
