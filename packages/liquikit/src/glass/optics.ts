export type LensShape = {
	halfWidth: number;
	halfHeight: number;
	borderRadius: number;
};

export type LensMap = {
	id: number;
	url: string;
	light: string;
	slices?: LensSlices;
	displacement: number;
	chroma: [number, number, number];
	reach: number;
	rimReach: number;
	shadingStrength: number;
};

export type LensSlices = {
	width: number;
	height: number;
	cut?: LensCut;
	map: string[];
	light: string[];
};

export type LensCut = {
	axis: "x" | "y";
	start: number;
	end: number;
};

export type LensProfile = {
	mapSize: number;
	ior: number;
	dispersion: number;
	thickness: number;
	base: number;
	bevel: number;
	bevelProfile: number;
	maxSlope: number;
	magnification: number;
	domeLength: number;
	softness: number;
	environment: number;
	rimLight: number;
	rimShadow: number;
	roughness: number;
	specularStrength: number;
	backLight: number;
	lightAngle: number;
	lightElevation: number;
	shadingStrength: number;
	openTint: number;
	edgeShadow: string;
	edgeInsetShadow: string;
	restEdgeShadow: string;
};

const PROFILE_SAMPLES = 512;

const DOME_HANDOVER = 0.5;

const SHAPE_STEP = 0.5;

const MIN_DENSITY = 2;
const MAX_DENSITY = 8;

export function snapShape(shape: LensShape): LensShape {
	const snap = (value: number) => Math.round(value / SHAPE_STEP) * SHAPE_STEP;
	return {
		halfWidth: snap(shape.halfWidth),
		halfHeight: snap(shape.halfHeight),
		borderRadius: snap(shape.borderRadius),
	};
}

const decodedMaps = new Set<string>();
const decodingMaps = new Map<string, Promise<void>>();

export function isMapDecoded(url: string) {
	return decodedMaps.has(url);
}

export function decodeMap(url: string): Promise<void> {
	if (decodedMaps.has(url)) return Promise.resolve();
	const pending = decodingMaps.get(url);
	if (pending) return pending;

	const task = new Promise<void>((resolve) => {
		if (typeof Image === "undefined") {
			resolve();
			return;
		}
		const image = new Image();
		const settle = () => {
			decodedMaps.add(url);
			decodingMaps.delete(url);
			resolve();
		};
		image.src = url;
		if (typeof image.decode === "function") {
			image.decode().then(settle, settle);
		} else {
			image.onload = settle;
			image.onerror = settle;
		}
	});
	decodingMaps.set(url, task);
	return task;
}

function clamp(value: number, low: number, high: number) {
	return value < low ? low : value > high ? high : value;
}

function toByte(value: number) {
	const rounded = Math.round(value);
	return rounded < 0 ? 0 : rounded > 255 ? 255 : rounded;
}

function surface(
	inward: number,
	thickness: number,
	bevel: number,
	shape: number,
	maxSlope: number,
	base: number,
) {
	if (inward >= 1) return { height: base + thickness, slope: 0 };
	const outward = 1 - inward;
	const raised = 1 - outward ** shape;
	const height = base + thickness * raised ** (1 / shape);
	const rise =
		raised > 1e-6
			? thickness * outward ** (shape - 1) * raised ** (1 / shape - 1)
			: thickness * 1e6;
	return { height, slope: Math.min(rise / bevel, maxSlope) };
}

type Profile = {
	magnitude: Float32Array;
	tangent: Float32Array;
	upward: Float32Array;
	fresnel: Float32Array;
	peak: number;
};

function buildProfile(profile: LensProfile, bevel: number): Profile {
	const magnitude = new Float32Array(PROFILE_SAMPLES);
	const tangent = new Float32Array(PROFILE_SAMPLES);
	const upward = new Float32Array(PROFILE_SAMPLES);
	const fresnel = new Float32Array(PROFILE_SAMPLES);
	const eta = 1 / profile.ior;
	const f0 = ((profile.ior - 1) / (profile.ior + 1)) ** 2;
	let peak = 0;

	for (let index = 0; index < PROFILE_SAMPLES; index += 1) {
		const inward = index / (PROFILE_SAMPLES - 1);
		const { height, slope } = surface(
			inward,
			profile.thickness,
			bevel,
			profile.bevelProfile,
			profile.maxSlope,
			profile.base,
		);
		const length = Math.hypot(slope, 1);
		const normalZ = 1 / length;
		const normalXY = slope / length;

		let reach = 0;
		const k = 1 - eta * eta * (1 - normalZ * normalZ);
		if (k >= 0) {
			const bend = eta * normalZ - Math.sqrt(k);
			const downward = -eta + bend * normalZ;
			if (downward < 0) reach = (bend * normalXY * height) / -downward;
		}

		magnitude[index] = reach;
		tangent[index] = normalXY;
		upward[index] = normalZ;
		fresnel[index] = (1 - f0) * (1 - normalZ) ** 5;
		const size = Math.abs(reach);
		if (size > peak) peak = size;
	}

	return { magnitude, tangent, upward, fresnel, peak };
}

let sharedCanvas: HTMLCanvasElement | undefined;

const mapCache = new Map<string, LensMap>();
const MAP_CACHE_LIMIT = 24;
let lastMapId = 0;

let encodeCanvas: HTMLCanvasElement | undefined;

function encodeImage(image: ImageData) {
	encodeCanvas ??= document.createElement("canvas");
	encodeCanvas.width = image.width;
	encodeCanvas.height = image.height;
	encodeCanvas
		.getContext("2d", { willReadFrequently: true })
		?.putImageData(image, 0, 0);
	return encodeCanvas.toDataURL("image/png");
}

function cornerReach(reach: number, step: number) {
	return Math.ceil(reach / step - 0.5) + 1;
}

function cropImage(
	image: ImageData,
	x0: number,
	x1: number,
	y0: number,
	y1: number,
) {
	const piece = new ImageData(x1 - x0, y1 - y0);
	for (let y = y0; y < y1; y += 1) {
		const from = (y * image.width + x0) * 4;
		piece.data.set(
			image.data.subarray(from, from + (x1 - x0) * 4),
			(y - y0) * piece.width * 4,
		);
	}
	return encodeImage(piece);
}

function planCut(
	width: number,
	height: number,
	reach: { x: number; y: number },
) {
	const axis = width >= height ? "x" : "y";
	const length = axis === "x" ? width : height;
	const ends = axis === "x" ? reach.x : reach.y;
	return ends * 2 < length
		? ({ axis, start: ends, end: ends } satisfies LensCut)
		: undefined;
}

function beyondStretch(
	cut: LensCut | undefined,
	row: number,
	column: number,
	width: number,
	height: number,
) {
	if (!cut) return false;
	return cut.axis === "x"
		? column > cut.start && column < width - cut.end
		: row > cut.start && row < height - cut.end;
}

function slicePieces(image: ImageData, cut: LensCut) {
	const { width, height } = image;
	const length = cut.axis === "x" ? width : height;
	return [
		[0, cut.start],
		[cut.start, cut.start + 1],
		[length - cut.end, length],
	].map(([from, to]) =>
		cut.axis === "x"
			? cropImage(image, from, to, 0, height)
			: cropImage(image, 0, width, from, to),
	);
}

function unslice(image: ImageData, cut: LensCut) {
	const { width, height, data } = image;
	const whole = new ImageData(new Uint8ClampedArray(data), width, height);
	for (let row = 0; row < height; row += 1) {
		for (let column = 0; column < width; column += 1) {
			if (!beyondStretch(cut, row, column, width, height)) continue;
			const from =
				(cut.axis === "x"
					? row * width + cut.start
					: cut.start * width + column) * 4;
			whole.data.copyWithin((row * width + column) * 4, from, from + 4);
		}
	}
	return whole;
}

export function profileKey(profile: LensProfile) {
	return [
		profile.ior,
		profile.dispersion,
		profile.thickness,
		profile.base,
		profile.bevel,
		profile.bevelProfile,
		profile.maxSlope,
		profile.magnification,
		profile.domeLength,
		profile.environment,
		profile.rimLight,
		profile.rimShadow,
		profile.roughness,
		profile.specularStrength,
		profile.backLight,
		profile.lightAngle,
		profile.lightElevation,
	].join(":");
}

function cacheKey(
	shape: LensShape,
	profile: LensProfile,
	width: number,
	height: number,
) {
	return [
		shape.halfWidth,
		shape.halfHeight,
		shape.borderRadius,
		width,
		height,
		profileKey(profile),
	].join(":");
}

function resolutionFor(shape: LensShape, ceiling: number, scale: number) {
	const width = shape.halfWidth * 2;
	const height = shape.halfHeight * 2;
	let density = clamp(scale, MIN_DENSITY, MAX_DENSITY);
	density = Math.min(density, ceiling / Math.max(width, height));
	return {
		width: Math.max(4, Math.round(width * density)),
		height: Math.max(4, Math.round(height * density)),
	};
}

function halfVector(azimuth: number, elevation: number) {
	const lightX = Math.cos(azimuth) * Math.cos(elevation);
	const lightY = -Math.sin(azimuth) * Math.cos(elevation);
	const lightZ = Math.sin(elevation);
	const length = Math.hypot(lightX, lightY, lightZ + 1) || 1;
	return {
		x: lightX / length,
		y: lightY / length,
		z: (lightZ + 1) / length,
	};
}

export function generateLensMap(
	shape: LensShape,
	profile: LensProfile,
	scale = 1,
): LensMap | undefined {
	if (typeof document === "undefined") return undefined;
	if (shape.halfWidth <= 0 || shape.halfHeight <= 0) return undefined;

	const snapped = snapShape(shape);
	const size = resolutionFor(snapped, profile.mapSize, scale);
	const key = cacheKey(snapped, profile, size.width, size.height);
	const cached = mapCache.get(key);
	if (cached) return cached;
	if (
		!sharedCanvas ||
		sharedCanvas.width !== size.width ||
		sharedCanvas.height !== size.height
	) {
		sharedCanvas = document.createElement("canvas");
		sharedCanvas.width = size.width;
		sharedCanvas.height = size.height;
	}
	const context = sharedCanvas.getContext("2d", { willReadFrequently: true });
	if (!context) return undefined;

	const { halfWidth, halfHeight } = snapped;
	const inradius = Math.min(halfWidth, halfHeight);
	const radius = clamp(snapped.borderRadius, 0, inradius);
	const bevel = clamp(profile.bevel, 0.5, inradius);

	const { magnitude, tangent, upward, fresnel } = buildProfile(profile, bevel);

	const pull = 1 - 1 / Math.max(profile.magnification, 0.01);
	const dished = Math.abs(pull) > 1e-4;
	const handover = bevel * DOME_HANDOVER;
	const lastSample = PROFILE_SAMPLES - 1;
	const perUnit = lastSample / bevel;

	const length = clamp(profile.domeLength, 0, 1);
	const coreX = Math.max(0, halfWidth - halfHeight) * length;
	const coreY = Math.max(0, halfHeight - halfWidth) * length;

	const azimuth = (profile.lightAngle * Math.PI) / 180;
	const elevation = (profile.lightElevation * Math.PI) / 180;
	const keyHalf = halfVector(azimuth, elevation);
	const echoHalf = halfVector(azimuth + Math.PI, elevation);

	const shininess = 2 / Math.max(1e-4, profile.roughness ** 4) - 2;
	const lobeFloor = (1 / 512) ** (1 / shininess);

	const { width, height } = size;
	const stepX = (2 * halfWidth) / width;
	const stepY = (2 * halfHeight) / height;
	const halfStep = (stepX + stepY) / 4;
	const innerX = halfWidth - radius;
	const innerY = halfHeight - radius;
	const cut = dished
		? undefined
		: planCut(width, height, {
				x: cornerReach(Math.max(radius, bevel), stepX),
				y: cornerReach(Math.max(radius, bevel), stepY),
			});
	const keep = (side: "x" | "y", size: number): Array<[number, number]> =>
		cut?.axis === side
			? [
					[0, cut.start + 1],
					[size - cut.end, size],
				]
			: [[0, size]];
	const keptRows = keep("y", height);
	const keptColumns = keep("x", width);
	const eachKept = (visit: (index: number) => void) => {
		for (const [firstRow, lastRow] of keptRows) {
			for (let row = firstRow; row < lastRow; row += 1) {
				for (const [firstColumn, lastColumn] of keptColumns) {
					for (let column = firstColumn; column < lastColumn; column += 1) {
						visit(row * width + column);
					}
				}
			}
		}
	};

	const count = width * height;
	const rimX = new Float32Array(count);
	const rimY = new Float32Array(count);
	const dishX = new Float32Array(count);
	const dishY = new Float32Array(count);
	const shades = new Float32Array(count);
	const covered = new Uint8ClampedArray(count);
	let reach = 0;
	let rimReach = 0;

	for (const [firstRow, lastRow] of keptRows)
		for (let row = firstRow; row < lastRow; row += 1) {
			const y = (row + 0.5) * stepY - halfHeight;
			const absY = Math.abs(y);
			const signY = y < 0 ? -1 : 1;
			const cornerY = absY - innerY;
			const axialY = y - clamp(y, -coreY, coreY);

			for (const [firstColumn, lastColumn] of keptColumns)
				for (let column = firstColumn; column < lastColumn; column += 1) {
					const index = row * width + column;
					const x = (column + 0.5) * stepX - halfWidth;
					const absX = Math.abs(x);
					const cornerX = absX - innerX;

					let distance: number;
					if (cornerX > 0 && cornerY > 0) {
						distance = Math.hypot(cornerX, cornerY) - radius;
					} else {
						distance = Math.max(cornerX, cornerY) - radius;
					}
					if (distance >= halfStep) continue;
					const coverage = clamp(0.5 - distance / (halfStep * 2), 0, 1);
					covered[index] = Math.round(coverage * 255);
					const depth = Math.max(0, -distance);

					if (dished) {
						const t = handover > 0 ? clamp(depth / handover, 0, 1) : 1;
						const fade = t * t * (3 - 2 * t) * coverage;
						const domeX = -pull * (x - clamp(x, -coreX, coreX)) * fade;
						const domeY = -pull * axialY * fade;
						dishX[index] = domeX;
						dishY[index] = domeY;
						const outside = Math.max(
							Math.abs(x + domeX) - halfWidth,
							Math.abs(y + domeY) - halfHeight,
						);
						if (outside > reach) reach = outside;
					}

					if (depth >= bevel) continue;

					let gradientX: number;
					let gradientY: number;
					if (cornerX > 0 && cornerY > 0) {
						const length = Math.hypot(cornerX, cornerY) || 1e-6;
						gradientX = (cornerX / length) * (x < 0 ? -1 : 1);
						gradientY = (cornerY / length) * signY;
					} else if (cornerX > cornerY) {
						gradientX = x < 0 ? -1 : 1;
						gradientY = 0;
					} else {
						gradientX = 0;
						gradientY = signY;
					}

					const at = depth * perUnit;
					const low = at | 0;
					const high = low >= lastSample ? lastSample : low + 1;
					const blend = at - low;

					const bend =
						magnitude[low] + (magnitude[high] - magnitude[low]) * blend;
					const lateral = tangent[low] + (tangent[high] - tangent[low]) * blend;
					const vertical = upward[low] + (upward[high] - upward[low]) * blend;
					const reflectance =
						fresnel[low] + (fresnel[high] - fresnel[low]) * blend;

					const normalX = lateral * gradientX;
					const normalY = lateral * gradientY;

					const facing = -normalY * profile.environment;
					let shade =
						reflectance *
						(profile.rimLight +
							(facing > 0 ? facing : facing * profile.rimShadow));

					const lobe =
						normalX * keyHalf.x + normalY * keyHalf.y + vertical * keyHalf.z;
					if (lobe > lobeFloor) {
						shade += lobe ** shininess * profile.specularStrength;
					}
					const echo =
						normalX * echoHalf.x + normalY * echoHalf.y + vertical * echoHalf.z;
					if (echo > lobeFloor && profile.backLight > 0) {
						shade +=
							echo ** shininess * profile.specularStrength * profile.backLight;
					}

					rimX[index] = bend * gradientX * coverage;
					rimY[index] = bend * gradientY * coverage;
					shades[index] = clamp(shade, -1, 1) * coverage;
					const beyond = Math.max(
						Math.abs(x + rimX[index] + dishX[index]) - halfWidth,
						Math.abs(y + rimY[index] + dishY[index]) - halfHeight,
					);
					if (beyond > rimReach) rimReach = beyond;
				}
		}

	let combinedPeak = 0;
	eachKept((index) => {
		rimX[index] += dishX[index];
		rimY[index] += dishY[index];
		const amount = Math.max(Math.abs(rimX[index]), Math.abs(rimY[index]));
		if (amount > combinedPeak) combinedPeak = amount;
	});
	const bendScale = combinedPeak > 1e-6 ? 127.5 / combinedPeak : 0;
	const image = context.createImageData(width, height);
	const pixels = image.data;
	const lightImage = context.createImageData(width, height);
	const lightPixels = lightImage.data;
	const shading = profile.shadingStrength;
	eachKept((index) => {
		const offset = index * 4;
		const red = toByte(127.5 + rimX[index] * bendScale);
		const green = toByte(127.5 + rimY[index] * bendScale);
		const blue = toByte(127.5 + 127.5 * shades[index]);
		const coverage = covered[index] / 255;
		const ground = 128 * (1 - coverage);
		pixels[offset] = Math.round(red * coverage + ground);
		pixels[offset + 1] = Math.round(green * coverage + ground);
		pixels[offset + 2] = covered[index];
		pixels[offset + 3] = 255;
		const lit = (blue * coverage + ground) / 255;
		const grey = toByte(255 * (0.5 + shading * (lit - 0.5)));
		lightPixels[offset] = grey;
		lightPixels[offset + 1] = grey;
		lightPixels[offset + 2] = grey;
		lightPixels[offset + 3] = 255;
	});
	const slices: LensSlices | undefined = dished
		? undefined
		: cut
			? {
					width,
					height,
					cut,
					map: slicePieces(image, cut),
					light: slicePieces(lightImage, cut),
				}
			: {
					width,
					height,
					map: [encodeImage(image)],
					light: [encodeImage(lightImage)],
				};
	let url: string | undefined;
	let light: string | undefined;
	if (!slices) {
		context.putImageData(image, 0, 0);
		url = sharedCanvas.toDataURL("image/png");
		light = encodeImage(lightImage);
	}

	const half = profile.dispersion * 0.5;
	lastMapId += 1;
	const result: LensMap = {
		id: lastMapId,
		get url() {
			if (url === undefined)
				url = encodeImage(cut ? unslice(image, cut) : image);
			return url;
		},
		get light() {
			if (light === undefined) {
				light = encodeImage(cut ? unslice(lightImage, cut) : lightImage);
			}
			return light;
		},
		slices,
		displacement: 2 * combinedPeak,
		chroma: [1 - half, 1, 1 + half],
		reach,
		rimReach: Math.max(rimReach, reach),
		shadingStrength: profile.shadingStrength,
	};

	if (mapCache.size >= MAP_CACHE_LIMIT) {
		const oldest = mapCache.keys().next().value;
		if (oldest !== undefined) mapCache.delete(oldest);
	}
	mapCache.set(key, result);
	return result;
}
