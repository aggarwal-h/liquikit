import { useLayoutEffect, useRef, useState } from "react";

export function useWidth<T extends HTMLElement>(initial: number) {
	const ref = useRef<T>(null);
	const [width, setWidth] = useState(initial);
	useLayoutEffect(() => {
		const element = ref.current;
		if (!element) return;
		const observer = new ResizeObserver(([entry]) =>
			setWidth(Math.round(entry.contentRect.width)),
		);
		observer.observe(element);
		return () => observer.disconnect();
	}, []);
	return [ref, width] as const;
}
