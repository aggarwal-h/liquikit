import { type RefObject, useEffect, useState } from "react";

const SCROLL_SETTLE_MS = 160;

let scrolling = false;
let listening = false;
let timer: ReturnType<typeof setTimeout> | undefined;
const waiting = new Set<() => void>();

function onScroll() {
	scrolling = true;
	clearTimeout(timer);
	timer = setTimeout(() => {
		scrolling = false;
		requestAnimationFrame(drain);
	}, SCROLL_SETTLE_MS);
}

function drain() {
	if (scrolling) return;
	const [task] = waiting;
	if (!task) return;
	waiting.delete(task);
	task();
	requestAnimationFrame(drain);
}

export function afterScroll(task: () => void) {
	if (!listening) {
		listening = true;
		window.addEventListener("scroll", onScroll, {
			capture: true,
			passive: true,
		});
	}
	if (!scrolling) {
		task();
		return () => {};
	}
	waiting.add(task);
	return () => {
		waiting.delete(task);
	};
}

export function useInView(
	ref: RefObject<Element | null>,
	margin: string,
	enabled: boolean,
) {
	const [inView, setInView] = useState(false);
	useEffect(() => {
		const element = ref.current;
		if (!enabled || !element || typeof IntersectionObserver === "undefined") {
			return;
		}
		const observer = new IntersectionObserver(
			([entry]) => setInView(entry.isIntersecting),
			{ rootMargin: margin },
		);
		observer.observe(element);
		return () => observer.disconnect();
	}, [enabled, margin, ref]);
	return inView;
}
