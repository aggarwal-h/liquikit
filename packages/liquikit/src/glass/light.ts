const overlays = new Map<string, Promise<string | undefined>>();
const ready = new Map<string, string>();
const OVERLAY_LIMIT = 64;

export function readyOverlay(light: string) {
	return ready.get(light);
}

// A light map is blended hard-light over the glass, which is the same as
// painting white (above mid-grey) or black (below) at |2L - 1|. Baking that
// into a transparent image lets plain CSS draw the light with no filter.
export function lightOverlay(light: string) {
	const known = overlays.get(light);
	if (known) return known;
	const made = new Promise<string | undefined>((resolve) => {
		if (typeof Image === "undefined") {
			resolve(undefined);
			return;
		}
		const image = new Image();
		image.src = light;
		// WebKit can fire load before a canvas is able to read the pixels.
		image.decode().then(
			() => {
				const canvas = document.createElement("canvas");
				canvas.width = image.naturalWidth;
				canvas.height = image.naturalHeight;
				const context = canvas.getContext("2d", { willReadFrequently: true });
				if (!context || canvas.width === 0 || canvas.height === 0) {
					resolve(undefined);
					return;
				}
				context.drawImage(image, 0, 0);
				const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
				const data = pixels.data;
				for (let offset = 0; offset < data.length; offset += 4) {
					const level = data[offset] / 255;
					const value = level >= 0.5 ? 255 : 0;
					data[offset] = value;
					data[offset + 1] = value;
					data[offset + 2] = value;
					data[offset + 3] = Math.round(Math.abs(2 * level - 1) * 255);
				}
				context.putImageData(pixels, 0, 0);
				const url = canvas.toDataURL("image/png");
				ready.set(light, url);
				resolve(url);
			},
			() => resolve(undefined),
		);
	});
	overlays.set(light, made);
	if (overlays.size > OVERLAY_LIMIT) {
		const oldest = overlays.keys().next().value;
		if (oldest !== undefined) {
			overlays.delete(oldest);
			ready.delete(oldest);
		}
	}
	return made;
}
