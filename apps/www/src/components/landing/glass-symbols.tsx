import type { MotionValue } from "motion/react";
import { type RefObject, useEffect, useRef, useState } from "react";

// Without GPU acceleration WebGL falls back to software rendering, and
// building this scene would hold the page for seconds. The hero reads fine
// without it, so the scene is left out there.
function hasFastWebGL() {
	try {
		const gl = document
			.createElement("canvas")
			.getContext("webgl2", { failIfMajorPerformanceCaveat: true });
		gl?.getExtension("WEBGL_lose_context")?.loseContext();
		return gl !== null;
	} catch {
		return false;
	}
}

export function GlassSymbols({
	progress,
	logo,
	onReady,
	className = "",
}: {
	progress?: MotionValue<number>;
	logo?: RefObject<HTMLElement | null>;
	onReady?: () => void;
	className?: string;
}) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [shown, setReady] = useState(false);
	const ready = useRef(onReady);
	ready.current = onReady;

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas || !hasFastWebGL()) return;
		let dispose: (() => void) | undefined;
		let cancelled = false;
		import("./glass-scene")
			.then(({ createGlassScene }) => {
				if (cancelled) return;
				dispose = createGlassScene(canvas, {
					progress: () => progress?.get() ?? 0,
					logo: () => logo?.current ?? null,
				}).dispose;
				setReady(true);
				ready.current?.();
			})
			.catch(() => {});
		return () => {
			cancelled = true;
			dispose?.();
		};
	}, [logo, progress]);

	return (
		<div
			aria-hidden="true"
			className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${shown ? "opacity-100" : "opacity-0"} ${className}`}
		>
			<canvas ref={canvasRef} className="size-full" />
		</div>
	);
}
