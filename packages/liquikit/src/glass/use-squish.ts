"use client";

import { type MotionValue, useMotionValue } from "motion/react";
import { useCallback, useEffect, useRef } from "react";

const MAX_SQUASH = 0.3;
const MAX_WOBBLE = 0.08;
export const MAX_STRETCH = 1 / (1 - MAX_SQUASH - MAX_WOBBLE);
export const MAX_SPREAD = 1 + MAX_WOBBLE;
const KNEE_SPEED = 900;
const HELD_SQUASH = 0.16;
const STIFFNESS = 240;
const DAMPING = 17;

const WOBBLE_FREQUENCY = 3.5;
const WOBBLE_DAMPING = 0.4;
const WOBBLE_KICK = 2.2;
const WOBBLE_FROM_STOP = 0.5;

const LAG_PIXELS = 3;
const LAG_KNEE_SPEED = 900;
const LAG_FREQUENCY = 4;
const LAG_DAMPING = 0.5;
const SUBSTEPS = 4;

export function useSquish(
	position: MotionValue<number>,
	enabled = true,
	liquid = 0,
	speedSquash = 1,
) {
	const squish = useMotionValue(0);
	const lag = useMotionValue(0);
	const held = useRef(0);
	const start = useRef<() => void>(() => {});
	const rebase = useRef<() => void>(() => {});
	const pending = useRef(0);
	const amount = enabled ? Math.max(0, liquid) : 0;

	useEffect(() => {
		if (!enabled) return;
		let frame = 0;
		let offset = 0;
		let velocity = 0;
		let wobble = 0;
		let wobbleVelocity = 0;
		let trail = 0;
		let trailVelocity = 0;
		let last = 0;
		let previous = position.get();
		let running = false;
		const wobbleRate = 2 * Math.PI * WOBBLE_FREQUENCY;
		const lagRate = 2 * Math.PI * LAG_FREQUENCY;

		const step = (now: number) => {
			const elapsed = (now - last) / 1000;
			const delta = Math.min(elapsed, 0.033);
			last = now;

			const current = position.get();
			const speed =
				(current - previous) / Math.min(Math.max(elapsed, 0.008), 0.03);
			previous = current;
			const magnitude = Math.abs(speed);

			const fromSpeed =
				MAX_SQUASH * speedSquash * (1 - Math.exp(-magnitude / KNEE_SPEED));
			const target =
				held.current > 0 ? Math.max(fromSpeed, held.current) : fromSpeed;

			const acceleration = -STIFFNESS * (offset - target) - DAMPING * velocity;
			velocity += acceleration * delta;
			offset += velocity * delta;

			if (Math.abs(offset - target) < 2e-3 && Math.abs(velocity) < 2e-2) {
				offset = target;
				velocity = 0;
			}

			if (amount > 0) {
				wobbleVelocity += pending.current;
				pending.current = 0;
				const trailTarget =
					-LAG_PIXELS * amount * Math.tanh(speed / LAG_KNEE_SPEED);
				const collapsing = offset > 0 ? velocity < 0 : velocity > 0;
				const thrown = collapsing ? WOBBLE_FROM_STOP * amount * velocity : 0;
				const slice = delta / SUBSTEPS;
				for (let index = 0; index < SUBSTEPS; index += 1) {
					wobbleVelocity +=
						(-wobbleRate * wobbleRate * wobble -
							2 * WOBBLE_DAMPING * wobbleRate * wobbleVelocity +
							thrown * wobbleRate) *
						slice;
					wobble += wobbleVelocity * slice;
					trailVelocity +=
						(-lagRate * lagRate * (trail - trailTarget) -
							2 * LAG_DAMPING * lagRate * trailVelocity) *
						slice;
					trail += trailVelocity * slice;
				}
				wobble = Math.max(-MAX_WOBBLE, Math.min(MAX_WOBBLE, wobble));
				if (Math.abs(wobble) < 5e-4 && Math.abs(wobbleVelocity) < 5e-3) {
					wobble = 0;
					wobbleVelocity = 0;
				}
				if (
					Math.abs(trail - trailTarget) < 0.02 &&
					Math.abs(trailVelocity) < 0.2
				) {
					trail = trailTarget;
					trailVelocity = 0;
				}
			}

			const shaped =
				speedSquash < 0 ? Math.min(0, offset) : Math.max(0, offset);
			squish.set(shaped + wobble);
			lag.set(Math.round(trail * 100) / 100);

			const settled =
				Math.abs(offset) < 5e-4 &&
				Math.abs(velocity) < 5e-3 &&
				magnitude < 5e-3 &&
				held.current === 0 &&
				wobble === 0 &&
				pending.current === 0 &&
				Math.abs(trail) < 0.01 &&
				trailVelocity === 0;
			if (settled) {
				running = false;
				squish.set(0);
				lag.set(0);
				return;
			}
			frame = requestAnimationFrame(step);
		};

		start.current = () => {
			if (running) return;
			running = true;
			last = performance.now();
			previous = position.get();
			frame = requestAnimationFrame(step);
		};

		rebase.current = () => {
			previous = position.get();
		};

		const unsubscribe = position.on("change", () => start.current());
		return () => {
			unsubscribe();
			cancelAnimationFrame(frame);
			start.current = () => {};
			rebase.current = () => {};
		};
	}, [amount, enabled, lag, position, speedSquash, squish]);

	// A move that was a jump, such as a track resizing under its handle, is not
	// speed: the next frame measures from where the jump landed.
	const jumped = useCallback(() => rebase.current(), []);

	const setHeld = useCallback((value: boolean) => {
		held.current = value ? HELD_SQUASH : 0;
		if (value) start.current();
	}, []);

	const kick = useCallback(
		(direction: 1 | -1) => {
			if (amount <= 0) return;
			pending.current += direction * WOBBLE_KICK * amount;
			start.current();
		},
		[amount],
	);

	return { squish, lag: amount > 0 ? lag : undefined, setHeld, kick, jumped };
}

export function squashed(base: number, amount: number, across: boolean) {
	const factor = 1 - Math.min(0.6, Math.max(-MAX_WOBBLE, amount));
	return across ? base * factor : base / factor;
}
