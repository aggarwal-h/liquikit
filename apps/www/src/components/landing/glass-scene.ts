import * as THREE from "three";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { MARK, MARK_PATH } from "./mark";

type Point = [number, number];

const REF = 30;
const FOV = 24;

function resample(points: Point[], closed: boolean, step: number) {
	const path = closed ? [...points, points[0]] : points;
	const out: Point[] = [path[0]];
	let carry = 0;
	for (let i = 1; i < path.length; i++) {
		const [ax, ay] = path[i - 1];
		const [bx, by] = path[i];
		const length = Math.hypot(bx - ax, by - ay);
		let at = step - carry;
		while (at <= length) {
			const k = at / length;
			out.push([ax + (bx - ax) * k, ay + (by - ay) * k]);
			at += step;
		}
		carry = length - (at - step);
	}
	if (!closed) out.push(path[path.length - 1]);
	else out.pop();
	return out;
}

function soften(points: Point[], closed: boolean, reach: number) {
	let current = points;
	for (let pass = 0; pass < 3; pass++) {
		current = current.map((point, i) => {
			if (!closed && (i < reach || i >= current.length - reach)) {
				const span = Math.min(i, current.length - 1 - i);
				if (span === 0) return point;
				return average(current, i, span, closed);
			}
			return average(current, i, reach, closed);
		});
	}
	return current;
}

function average(
	points: Point[],
	index: number,
	reach: number,
	closed: boolean,
) {
	let x = 0;
	let y = 0;
	let count = 0;
	for (let k = -reach; k <= reach; k++) {
		let j = index + k;
		if (closed) j = (j + points.length) % points.length;
		else if (j < 0 || j >= points.length) continue;
		x += points[j][0];
		y += points[j][1];
		count++;
	}
	return [x / count, y / count] as Point;
}

function arc(
	cx: number,
	cy: number,
	r: number,
	from: number,
	to: number,
	steps: number,
) {
	const out: Point[] = [];
	for (let i = 0; i <= steps; i++) {
		const a = ((from + ((to - from) * i) / steps) * Math.PI) / 180;
		out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
	}
	return out;
}

function profile(width: number, depth: number, bevel: number) {
	const out: Point[] = [];
	const corners: Array<[number, number, number]> = [
		[width - bevel, depth - bevel, 0],
		[-(width - bevel), depth - bevel, 90],
		[-(width - bevel), -(depth - bevel), 180],
		[width - bevel, -(depth - bevel), 270],
	];
	for (const [cx, cy, from] of corners) {
		for (let i = 0; i <= 8; i++) {
			const a = ((from + (90 * i) / 8) * Math.PI) / 180;
			out.push([cx + bevel * Math.cos(a), cy + bevel * Math.sin(a)]);
		}
	}
	return out;
}

function sweep(path: Point[], closed: boolean, section: Point[]) {
	const rings: number[][] = [];
	const count = path.length;
	const at = (i: number) =>
		path[closed ? (i + count) % count : Math.max(0, Math.min(count - 1, i))];
	const reach = Math.max(...section.map(([u]) => Math.abs(u)));
	const ringAt = (i: number, scale: number, shift: number) => {
		const [px, py] = at(i);
		const [ax, ay] = at(i - 1);
		const [bx, by] = at(i + 1);
		const length = Math.hypot(bx - ax, by - ay) || 1;
		const tx = (bx - ax) / length;
		const ty = (by - ay) / length;
		const ring: number[] = [];
		for (const [u, v] of section) {
			ring.push(
				px - ty * u * scale + tx * shift,
				-(py + tx * u * scale + ty * shift),
				v * scale,
			);
		}
		return ring;
	};
	const cap = (i: number, sign: number) => {
		const out: number[][] = [];
		for (let k = 8; k >= 1; k--) {
			const a = (k / 8) * (Math.PI / 2);
			out.push(
				ringAt(i, Math.max(Math.cos(a), 0.02), sign * Math.sin(a) * reach),
			);
		}
		return out;
	};
	if (!closed) rings.push(...cap(0, -1));
	for (let i = 0; i < count; i++) rings.push(ringAt(i, 1, 0));
	if (!closed) rings.push(...cap(count - 1, 1).reverse());
	const size = section.length;
	const positions = new Float32Array(rings.length * size * 3);
	rings.forEach((ring, j) => {
		positions.set(ring, j * size * 3);
	});
	const index: number[] = [];
	const last = closed ? rings.length : rings.length - 1;
	for (let j = 0; j < last; j++) {
		const next = (j + 1) % rings.length;
		for (let k = 0; k < size; k++) {
			const a = j * size + k;
			const b = j * size + ((k + 1) % size);
			const c = next * size + k;
			const d = next * size + ((k + 1) % size);
			index.push(a, b, c, b, d, c);
		}
	}
	if (!closed) {
		for (const j of [0, rings.length - 1]) {
			for (let k = 1; k < size - 1; k++) {
				const base = j * size;
				if (j === 0) index.push(base, base + k + 1, base + k);
				else index.push(base, base + k, base + k + 1);
			}
		}
	}
	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
	geometry.setIndex(index);
	geometry.computeVertexNormals();
	const normals = geometry.getAttribute("normal");
	const top = section.findIndex(
		([, v]) => v === Math.max(...section.map((p) => p[1])),
	);
	const probe = (closed ? 0 : 8) * size + top;
	if (normals.getZ(probe) < 0) {
		for (let i = 0; i < index.length; i += 3) {
			const swap = index[i + 1];
			index[i + 1] = index[i + 2];
			index[i + 2] = swap;
		}
		geometry.setIndex(index);
		geometry.computeVertexNormals();
	}
	return geometry;
}

function band(points: Point[], closed: boolean, width: number, fillet: number) {
	const step = 0.008;
	const even = resample(points, closed, step);
	const smooth = soften(even, closed, Math.max(1, Math.round(fillet / step)));
	const depth = width * 0.7;
	return [sweep(smooth, closed, profile(width, depth, depth * 0.85))];
}

function pill(width: number, height: number, depth: number) {
	const radius = height / 2;
	const geometry = new THREE.CapsuleGeometry(radius, width - height, 32, 96);
	geometry.rotateZ(Math.PI / 2);
	geometry.scale(1, 1, depth / radius);
	geometry.computeVertexNormals();
	geometry.userData.lens = true;
	return geometry;
}

function framedPill(width: number, height: number, rim: number) {
	const radius = height / 2;
	const reach = width / 2 - radius;
	const outline = [
		...arc(reach, 0, radius, -90, 90, 48),
		...arc(-reach, 0, radius, 90, 270, 48),
	];
	const frame = band(outline, true, rim, 0.02);
	for (const geometry of frame) geometry.userData.rim = true;
	return [...frame, pill(width - rim * 1.6, height - rim * 1.6, rim * 0.8)];
}

function bead(x: number, y: number, radius: number) {
	const geometry = new THREE.SphereGeometry(radius, 48, 24);
	geometry.scale(1, 1, 0.55);
	geometry.translate(x, -y, 0);
	return geometry;
}

type Symbol = {
	parts: () => THREE.BufferGeometry[];
	x: number;
	y: number;
	z: number;
	size: number;
	turn: number;
	soft: boolean;
	delay: number;
};

const SYMBOLS: Symbol[] = [
	{
		parts: () =>
			band(
				[
					[-0.66, 0.04],
					[-0.2, 0.52],
					[0.7, -0.5],
				],
				false,
				0.14,
				0.14,
			),
		x: -210,
		y: 2,
		z: -1.6,
		size: 36,
		turn: 0.85,
		soft: true,
		delay: 0.26,
	},
	{
		parts: () => [
			...band(
				arc(-0.14, -0.14, 0.56, 0, 360, 160).slice(0, -1),
				true,
				0.12,
				0.02,
			),
			...band(
				[
					[0.3, 0.3],
					[0.72, 0.72],
				],
				false,
				0.15,
				0.02,
			),
		],
		x: -140,
		y: 0,
		z: -0.6,
		size: 46,
		turn: 0.55,
		soft: false,
		delay: 0.12,
	},
	{
		parts: () => framedPill(2, 0.94, 0.1),
		x: 0,
		y: -2,
		z: 0.8,
		size: 68,
		turn: 0,
		soft: false,
		delay: 0,
	},
	{
		parts: () =>
			band(
				[
					[-0.46, -0.86],
					[0.62, 0.02],
					[0.08, 0.14],
					[-0.16, 0.8],
				],
				true,
				0.125,
				0.14,
			),
		x: 132,
		y: 0,
		z: -0.6,
		size: 48,
		turn: -0.5,
		soft: false,
		delay: 0.12,
	},
	{
		parts: () => [
			...band(arc(0, 0, 0.76, 0, 360, 160).slice(0, -1), true, 0.12, 0.02),
			bead(0, 0, 0.2),
		],
		x: 200,
		y: 0,
		z: -1.6,
		size: 36,
		turn: -1.2,
		soft: true,
		delay: 0.26,
	},
];

const BACKDROP_VERTEX = `
varying vec2 vUv;
void main() {
	vUv = uv;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const BACKDROP_FRAGMENT = `
uniform vec3 uNeon;
uniform vec3 uDeep;
uniform vec2 uSpan;
uniform vec2 uRow;
uniform float uLight;
uniform vec3 uHot;
uniform vec2 uPlane;
uniform vec4 uSpots[5];
uniform vec4 uLogo;
varying vec2 vUv;

vec3 saturateColor(vec3 color, float amount) {
	return max(mix(vec3(dot(color, vec3(0.3, 0.59, 0.11))), color, amount), 0.0);
}

void main() {
	vec2 q = (vUv - uRow) * uSpan;
	q.y = -q.y;
	vec2 wide = (q - vec2(0.0, 40.0)) / vec2(340.0, 175.0);
	vec2 core = q / vec2(170.0, 70.0);
	vec3 blue = saturateColor(uNeon, 1.6) * vec3(0.55, 0.9, 1.0);
	float light = 0.42 * exp(-dot(wide, wide) * 2.0) + 0.34 * exp(-dot(core, core) * 1.3);
	vec3 col = blue * light + uDeep * 0.35 * exp(-dot(wide, wide) * 0.6);
	col *= smoothstep(-310.0, -70.0, q.y) * (0.55 + 0.45 * smoothstep(430.0, 160.0, abs(q.x)));
	vec2 at = (vUv - 0.5) * uPlane;
	vec3 shine = mix(uHot, vec3(0.5, 0.78, 1.0), 0.5);
	for (int i = 0; i < 5; i++) {
		vec4 spot = uSpots[i];
		vec2 d = (at - spot.xy) / spot.z;
		float r2 = dot(d, d);
		col += shine * spot.w * (0.9 * exp(-r2 * 3.0) + 0.35 * exp(-r2 * 0.8));
	}
	vec2 l = (at - uLogo.xy) / uLogo.z;
	col += blue * uLogo.w * (0.7 * exp(-dot(l, l) * 2.2) + 0.3 * exp(-dot(l, l) * 0.5));
	gl_FragColor = vec4(col * uLight, 1.0);
	#include <colorspace_fragment>
}`;

function readColor(element: Element, name: string, fallback: string) {
	const value = getComputedStyle(element).getPropertyValue(name).trim();
	const color = new THREE.Color();
	try {
		color.setStyle(value || fallback, THREE.SRGBColorSpace);
	} catch {
		color.setStyle(fallback, THREE.SRGBColorSpace);
	}
	return color;
}

function studio(renderer: THREE.WebGLRenderer, neon: THREE.Color) {
	const room = new THREE.Scene();
	room.background = neon.clone().multiplyScalar(0.22);
	const white = new THREE.Color(0xb8d8ff);
	const glow = (color: THREE.Color, strength: number) =>
		new THREE.MeshBasicMaterial({
			color: color.clone().multiplyScalar(strength),
			side: THREE.DoubleSide,
		});
	const panel = (
		material: THREE.Material,
		width: number,
		height: number,
		position: [number, number, number],
	) => {
		const mesh = new THREE.Mesh(
			new THREE.PlaneGeometry(width, height),
			material,
		);
		mesh.position.set(...position);
		mesh.lookAt(0, 0, 0);
		room.add(mesh);
	};
	const halo = new THREE.Mesh(
		new THREE.TorusGeometry(9, 0.5, 16, 96),
		glow(white, 4.5),
	);
	halo.position.z = 1.2;
	room.add(halo);
	panel(glow(white, 18), 14, 0.9, [0, 7, 2.5]);
	panel(glow(white, 11), 0.9, 8, [-7.5, 0.5, 3]);
	panel(glow(white, 8), 0.9, 8, [7.5, 0.5, 3]);
	panel(glow(white, 14), 3, 3, [-5, -5, 3]);
	panel(glow(neon, 2.5), 24, 14, [0, 0, -9]);
	panel(glow(neon, 3), 20, 6, [0, -7, 0]);
	const pmrem = new THREE.PMREMGenerator(renderer);
	const sharp = pmrem.fromScene(room, 0.015);
	const soft = pmrem.fromScene(room, 0.09);
	const stage = new THREE.Scene();
	stage.background = neon.clone().multiplyScalar(0.12);
	const box = new THREE.Mesh(
		new THREE.PlaneGeometry(18, 7),
		new THREE.ShaderMaterial({
			side: THREE.DoubleSide,
			uniforms: {
				uTop: { value: white.clone().multiplyScalar(1.6) },
				uBottom: { value: neon.clone().multiplyScalar(0.25) },
			},
			vertexShader:
				"varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
			fragmentShader:
				"uniform vec3 uTop; uniform vec3 uBottom; varying vec2 vUv; void main() { gl_FragColor = vec4(mix(uBottom, uTop, smoothstep(0.35, 1.0, vUv.y)), 1.0); }",
		}),
	);
	box.position.set(0, 2, 7);
	box.lookAt(0, 0, 0);
	stage.add(box);
	const strip = (
		x: number,
		y: number,
		z: number,
		w: number,
		h: number,
		k: number,
	) => {
		const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glow(white, k));
		mesh.position.set(x, y, z);
		mesh.lookAt(0, 0, 0);
		stage.add(mesh);
	};
	strip(0, 7, 1, 16, 1.4, 4.2);
	strip(-8, 1, 2, 1.1, 6, 3.2);
	strip(8, 1, 2, 1.1, 6, 2.4);
	strip(0, -6, 3, 10, 0.8, 1.4);
	const floor = new THREE.Mesh(new THREE.PlaneGeometry(24, 8), glow(neon, 0.9));
	floor.position.set(0, -7, 1);
	floor.lookAt(0, 0, 0);
	stage.add(floor);
	const front = pmrem.fromScene(stage, 0.02);
	pmrem.dispose();
	return { sharp, soft, front };
}

function ease(t: number) {
	const k = Math.min(1, Math.max(0, t));
	return 1 - (1 - k) ** 3;
}

function back(t: number) {
	const k = Math.min(1, Math.max(0, t));
	const c = 1.4;
	return 1 + (c + 1) * (k - 1) ** 3 + c * (k - 1) ** 2;
}

function markGeometry() {
	const loader = new SVGLoader();
	const shapes = loader
		.parse(
			`<svg xmlns="http://www.w3.org/2000/svg"><path d="${MARK_PATH}"/></svg>`,
		)
		.paths.flatMap((path) => path.toShapes());
	const geometry = new THREE.ExtrudeGeometry(shapes, {
		depth: MARK.depth,
		bevelEnabled: true,
		bevelThickness: 9,
		bevelSize: 7,
		bevelOffset: -7,
		bevelSegments: 16,
		curveSegments: 32,
	});
	geometry.applyMatrix4(
		new THREE.Matrix4()
			.makeRotationX(Math.PI)
			.multiply(
				new THREE.Matrix4().makeTranslation(
					-MARK.size / 2,
					-MARK.size / 2,
					-MARK.depth / 2,
				),
			),
	);
	return geometry;
}

function offsetOf(element: HTMLElement) {
	let x = 0;
	let y = 0;
	let node: HTMLElement | null = element;
	while (node) {
		x += node.offsetLeft;
		y += node.offsetTop;
		node = node.offsetParent as HTMLElement | null;
	}
	return { x, y };
}

export type GlassScene = { dispose: () => void };

export function createGlassScene(
	canvas: HTMLCanvasElement,
	options: {
		progress?: () => number;
		logo?: () => HTMLElement | null;
	} = {},
): GlassScene {
	const renderer = new THREE.WebGLRenderer({
		canvas,
		antialias: true,
		alpha: false,
		powerPreference: "high-performance",
	});
	renderer.toneMapping = THREE.NoToneMapping;
	renderer.setClearColor(0x000000, 1);

	const neon = readColor(canvas, "--neon", "#2553ff");
	const hot = readColor(canvas, "--neon-hot", "#a6bcff");
	const deep = readColor(canvas, "--neon-deep", "#040c3a");

	const scene = new THREE.Scene();
	const environment = studio(renderer, neon);
	scene.environment = environment.sharp.texture;
	scene.environmentIntensity = 1.5;

	const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
	camera.position.set(0, 0, 20);

	const backdropUniforms = {
		uNeon: { value: neon.clone() },
		uDeep: { value: deep.clone() },
		uSpan: { value: new THREE.Vector2(1, 1) },
		uRow: { value: new THREE.Vector2(0.5, 0.3) },
		uLight: { value: 0 },
		uHot: { value: hot.clone() },
		uPlane: { value: new THREE.Vector2(1, 1) },
		uSpots: { value: SYMBOLS.map(() => new THREE.Vector4()) },
		uLogo: { value: new THREE.Vector4() },
	};
	const backdrop = new THREE.Mesh(
		new THREE.PlaneGeometry(1, 1),
		new THREE.ShaderMaterial({
			uniforms: backdropUniforms,
			vertexShader: BACKDROP_VERTEX,
			fragmentShader: BACKDROP_FRAGMENT,
			depthWrite: false,
		}),
	);
	backdrop.position.z = -10;
	scene.add(backdrop);

	const glass = (soft: boolean) =>
		new THREE.MeshPhysicalMaterial({
			color: 0xffffff,
			metalness: 0,
			roughness: soft ? 0.3 : 0.045,
			transmission: 1,
			thickness: 1.3,
			ior: 1.5,
			dispersion: 4,
			attenuationColor: hot.clone(),
			attenuationDistance: 4,
			clearcoat: 1,
			clearcoatRoughness: soft ? 0.3 : 0.02,
			specularIntensity: 1,
			iridescence: 0.35,
			iridescenceIOR: 1.25,
			emissive: neon.clone(),
			emissiveIntensity: 0.14,
		});
	const sharp = glass(false);
	const lens = glass(false);
	lens.thickness = 0.35;
	lens.envMap = environment.soft.texture;
	lens.envMapIntensity = 0.8;
	lens.attenuationDistance = 8;
	lens.clearcoat = 0;
	lens.iridescence = 0.25;
	lens.emissiveIntensity = 0.04;
	const rim = glass(false);
	rim.envMap = environment.sharp.texture;
	rim.envMapIntensity = 1.2;
	rim.emissiveIntensity = 0.04;
	rim.attenuationColor = neon.clone().lerp(hot, 0.5);
	rim.attenuationDistance = 1.2;
	const frosted = glass(true);
	const markGlass = glass(false);
	markGlass.thickness = 0.5;
	markGlass.envMap = environment.front.texture;
	markGlass.envMapIntensity = 1.8;
	markGlass.emissive = neon.clone().lerp(hot, 0.35);
	markGlass.emissiveIntensity = 0.2;
	markGlass.attenuationColor = hot.clone();
	markGlass.attenuationDistance = 3;
	markGlass.iridescence = 0.15;

	const logo = new THREE.Group();
	const logoPivot = new THREE.Group();
	logoPivot.add(new THREE.Mesh(markGeometry(), markGlass));
	logo.add(logoPivot);
	logo.visible = false;
	scene.add(logo);
	const logoAt = { x: 0, y: 0, scale: 1, perPixel: 0, placed: false };

	const row = new THREE.Group();
	scene.add(row);
	const items = SYMBOLS.map((symbol) => {
		const holder = new THREE.Group();
		const pivot = new THREE.Group();
		const scale = symbol.size / REF;
		for (const geometry of symbol.parts()) {
			const mesh = new THREE.Mesh(
				geometry,
				geometry.userData.lens
					? lens
					: geometry.userData.rim
						? rim
						: symbol.soft
							? frosted
							: sharp,
			);
			mesh.scale.set(scale, scale, scale * 0.85);
			pivot.add(mesh);
		}
		holder.add(pivot);
		holder.position.set(symbol.x / REF, -symbol.y / REF, symbol.z);
		row.add(holder);
		return { symbol, holder, pivot };
	});

	const composer = new EffectComposer(renderer);
	composer.addPass(new RenderPass(scene, camera));
	const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 1.0, 0.45, 0.46);
	composer.addPass(bloom);
	composer.addPass(new OutputPass());

	const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
	const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
	let width = 1;
	let height = 1;
	let frame = 0;
	let visible = true;
	let start = performance.now();
	let distance = 20;
	let rowY = 0;
	const target = new THREE.Vector3();
	const probe = new THREE.Vector3();

	const resize = () => {
		width = Math.max(1, canvas.clientWidth);
		height = Math.max(1, canvas.clientHeight);
		const ratio = Math.min(2, window.devicePixelRatio || 1);
		renderer.setPixelRatio(ratio);
		renderer.setSize(width, height, false);
		composer.setPixelRatio(ratio);
		composer.setSize(width, height);
		bloom.resolution.set(width, height);
		const unit = Math.min(width / 520, height / 480);
		const viewHeight = height / unit / REF;
		distance = viewHeight / 2 / Math.tan(THREE.MathUtils.degToRad(FOV / 2));
		camera.aspect = width / height;
		camera.updateProjectionMatrix();
		const rowAt = width / height < 0.8 ? 0.6 : 0.7;
		rowY = -((rowAt - 0.5) * height) / unit / REF;
		row.position.y = rowY;
		target.set(0, rowY - SYMBOLS[2].y / REF, 0);
		const depth = distance - backdrop.position.z;
		const planeHeight = 2 * depth * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
		backdrop.scale.set(planeHeight * camera.aspect * 1.2, planeHeight * 1.2, 1);
		backdropUniforms.uPlane.value.set(backdrop.scale.x, backdrop.scale.y);
		backdropUniforms.uSpan.value.set(
			(width / unit) * 1.2,
			(height / unit) * 1.2,
		);
		backdropUniforms.uRow.value.set(0.5, 0.5 - (rowAt - 0.5) / 1.2);
		const anchor = options.logo?.();
		if (anchor && anchor.offsetWidth > 0) {
			const from = offsetOf(canvas);
			const to = offsetOf(anchor);
			const perPixel = 1 / (unit * REF);
			logoAt.x =
				(to.x - from.x + anchor.offsetWidth / 2 - width / 2) * perPixel;
			logoAt.y =
				(height / 2 - (to.y - from.y + anchor.offsetHeight / 2)) * perPixel;
			logoAt.scale = (anchor.offsetWidth * perPixel) / MARK.size;
			logoAt.perPixel = perPixel;
			logoAt.placed = true;
		}
	};

	const render = (now: number) => {
		const elapsed = reduce.matches ? 10 : (now - start) / 1000;
		const time = reduce.matches ? 0 : now / 1000;
		const travel = Math.min(1, Math.max(0, options.progress?.() ?? 0));
		const dive = travel ** 1.7;
		const calm = 1 - dive;
		pointer.x += (pointer.tx - pointer.x) * 0.05;
		pointer.y += (pointer.ty - pointer.y) * 0.05;
		for (const [i, { symbol, holder, pivot }] of items.entries()) {
			const t = (elapsed - 0.1 - symbol.delay) / 1.35;
			const rise = back(t);
			const lift = ease(t);
			holder.position.y =
				-symbol.y / REF -
				(1 - lift) * 0.35 +
				Math.sin(time * 0.9 + i * 1.4) * 0.05 * calm;
			pivot.rotation.x =
				(1 - rise) * (symbol.turn === 0 ? -0.75 : -1.5) +
				(Math.sin(time * 0.6 + i) * 0.05 - pointer.y * 0.12) * calm;
			pivot.rotation.y =
				symbol.turn * (0.75 + 0.25 * lift) +
				(Math.sin(time * 0.45 + i * 1.1) * 0.12 + pointer.x * 0.25) * calm;
			pivot.rotation.z = Math.sin(time * 0.5 + i * 2.1) * 0.03 * calm;
		}
		const leave = Math.min(1, travel / 0.22);
		const arrive = back((elapsed - 0.05) / 1.25);
		const appear = ease((elapsed - 0.02) / 0.7);
		logo.visible = logoAt.placed && leave < 1;
		logo.position.set(
			logoAt.x,
			logoAt.y +
				(1 - ease((elapsed - 0.05) / 1.25)) * -0.25 +
				80 * logoAt.perPixel * Math.min(1, travel / 0.3),
			0,
		);
		logo.scale.setScalar(logoAt.scale * (1 - 0.12 * leave));
		logoPivot.rotation.x =
			(1 - arrive) * -1.1 +
			(Math.sin(time * 0.5) * 0.03 - pointer.y * 0.06) * calm;
		logoPivot.rotation.y =
			Math.sin(time * 0.35) * 0.05 + pointer.x * 0.12 * calm;
		markGlass.opacity = appear * (1 - leave);
		markGlass.transparent = markGlass.opacity < 1;
		markGlass.envMapRotation.set(0, time * 0.3 + (1 - arrive) * 2.4, 0);
		const flare = 1 - ease((elapsed - 0.2) / 1.8);
		scene.environmentRotation.y =
			time * 0.18 + pointer.x * 0.4 * calm + flare * 1.4;
		rim.envMapRotation.set(0, scene.environmentRotation.y, time * 0.55);
		lens.envMapRotation.set(0, scene.environmentRotation.y, time * 0.55);
		const glow = ease((elapsed - 0.02) / 0.9);
		camera.position.set(
			0,
			target.y * dive,
			distance + (-0.6 - distance) * dive,
		);
		camera.lookAt(0, target.y * dive, -20);
		backdropUniforms.uLight.value = glow * (1 + 2.4 * dive);
		for (const [i, { symbol, holder }] of items.entries()) {
			const centre = symbol.turn === 0;
			holder.getWorldPosition(probe);
			probe.x -= (symbol.size / REF) * (centre ? 0 : 0.32);
			probe.y -= (symbol.size / REF) * (centre ? 0.05 : 0.58);
			const reach =
				(backdrop.position.z - camera.position.z) /
				(probe.z - camera.position.z);
			const spot = backdropUniforms.uSpots.value[i];
			spot.set(
				camera.position.x + (probe.x - camera.position.x) * reach,
				camera.position.y + (probe.y - camera.position.y) * reach,
				(symbol.size / REF) * reach * (centre ? 1.05 : 0.6),
				(centre ? 0.03 : symbol.soft ? 0.18 : 0.24) *
					ease((elapsed - 0.2 - symbol.delay) / 1.2),
			);
		}
		logo.getWorldPosition(probe);
		const reach =
			(backdrop.position.z - camera.position.z) / (probe.z - camera.position.z);
		backdropUniforms.uLogo.value.set(
			camera.position.x + (probe.x - camera.position.x) * reach,
			camera.position.y + (probe.y - camera.position.y) * reach,
			MARK.size * logoAt.scale * reach * 0.9,
			logo.visible ? 0.07 * appear * (1 - leave) : 0,
		);
		bloom.strength = glow * (1.45 + 0.7 * flare + 3 * dive);
		composer.render();
	};

	const loop = (now: number) => {
		render(now);
		frame = requestAnimationFrame(loop);
	};

	const run = () => {
		cancelAnimationFrame(frame);
		if (visible && !document.hidden && !reduce.matches) {
			frame = requestAnimationFrame(loop);
		} else {
			frame = requestAnimationFrame(render);
		}
	};

	resize();
	start = performance.now();
	const sizes = new ResizeObserver(() => {
		resize();
		run();
	});
	sizes.observe(canvas);
	const seen = new IntersectionObserver(([entry]) => {
		visible = entry.isIntersecting;
		run();
	});
	seen.observe(canvas);
	const move = (event: PointerEvent) => {
		pointer.tx = (event.clientX / window.innerWidth - 0.5) * 2;
		pointer.ty = (event.clientY / window.innerHeight - 0.5) * 2;
	};
	window.addEventListener("pointermove", move, { passive: true });
	document.addEventListener("visibilitychange", run);
	run();

	return {
		dispose: () => {
			cancelAnimationFrame(frame);
			sizes.disconnect();
			seen.disconnect();
			window.removeEventListener("pointermove", move);
			document.removeEventListener("visibilitychange", run);
			scene.traverse((object) => {
				if (object instanceof THREE.Mesh) {
					object.geometry.dispose();
					(object.material as THREE.Material).dispose();
				}
			});
			environment.sharp.dispose();
			environment.soft.dispose();
			environment.front.dispose();
			composer.dispose();
			renderer.dispose();
		},
	};
}
