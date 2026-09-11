let smoothDisplacement: boolean | undefined;

export function displacementIsSmooth() {
	if (smoothDisplacement === undefined) {
		smoothDisplacement =
			typeof navigator !== "undefined" &&
			/\bGecko\/\d/.test(navigator.userAgent);
	}
	return smoothDisplacement;
}
