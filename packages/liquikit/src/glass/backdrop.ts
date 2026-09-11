let backdropSupport: boolean | undefined;

export function supportsBackdropRefraction() {
	if (backdropSupport !== undefined) return backdropSupport;
	if (typeof navigator === "undefined" || typeof CSS === "undefined") {
		return false;
	}
	const brands = (
		navigator as Navigator & {
			userAgentData?: { brands?: Array<{ brand: string }> };
		}
	).userAgentData?.brands;
	backdropSupport =
		Boolean(brands?.some(({ brand }) => brand === "Chromium")) &&
		CSS.supports("backdrop-filter", "url(#glass)");
	return backdropSupport;
}

const ROOT_KEYFRAMES = [
	"opacity",
	"filter",
	"backdropFilter",
	"clipPath",
	"mask",
	"maskImage",
];

// A backdrop filter reads only up to the nearest backdrop root: an ancestor
// with opacity, a filter, a backdrop filter, a mask, a clip-path or a blend
// mode. Under one it sees that ancestor's own see-through paint over nothing,
// and Chromium draws the box dark. An animation that ever touched opacity or a
// filter keeps the root while it fills, even once it has settled on 1.
export function underBackdropRoot(element: Element) {
	const top = element.ownerDocument.documentElement;
	for (
		let node = element.parentElement;
		node && node !== top;
		node = node.parentElement
	) {
		const style = getComputedStyle(node);
		if (
			Number(style.opacity) < 1 ||
			style.filter !== "none" ||
			style.backdropFilter !== "none" ||
			style.clipPath !== "none" ||
			style.maskImage !== "none" ||
			style.mixBlendMode !== "normal" ||
			/opacity|filter|mask|clip-path|mix-blend-mode/.test(style.willChange)
		) {
			return true;
		}
		for (const animation of node.getAnimations?.() ?? []) {
			const effect = animation.effect;
			if (
				effect instanceof KeyframeEffect &&
				effect
					.getKeyframes()
					.some((frame) => ROOT_KEYFRAMES.some((key) => key in frame))
			) {
				return true;
			}
		}
	}
	return false;
}
