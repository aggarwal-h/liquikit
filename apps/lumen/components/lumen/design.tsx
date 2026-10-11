"use client";

import { GlassScope } from "@/components/liquikit/glass";
import { SegmentedControl } from "@/components/liquikit/segmented-control";
import { Lamp } from "./lamp";
import { FINISHES, isFinish } from "./light";
import { Reveal } from "./reveal";
import { Stage } from "./stage";
import { useLumen } from "./state";

// The one light section: a lamp on a pale wall, glass in its light theme.
export function Design() {
	const { finish, setFinish } = useLumen();
	const chosen = FINISHES.find((f) => f.value === finish) ?? FINISHES[0];

	return (
		<section
			id="design"
			className="mt-32 scroll-mt-20 bg-(--wall) pt-24 pb-28 text-[#1d1d1f]"
		>
			<Reveal>
				<header className="mx-auto max-w-[740px] px-6 text-center">
					<h2 className="text-[clamp(36px,5.4vw,64px)] leading-[1.05] font-semibold tracking-[-0.035em]">
						Three finishes.
					</h2>
					<p className="mx-auto mt-5 max-w-[34rem] text-[19px] leading-[1.42] text-[#6e6e73] sm:text-[21px]">
						Brushed aluminium around a diffuser of frosted glass. In silver,
						graphite or sand, and the one you choose follows you to the bag.
					</p>
				</header>
			</Reveal>
			<Reveal>
				<Stage
					className="mt-10 max-w-[960px] bg-(--wall) [--lamp:min(400px,70vw)]"
					layout="flex flex-col items-center pt-[calc(var(--lamp)*0.34)] pb-8"
				>
					<Lamp kelvin={2700} level={0.5} finish={finish} size="var(--lamp)" />
					<GlassScope className="capsule on-light relative z-10 mt-[calc(var(--lamp)*0.14)] inline-block">
						<SegmentedControl
							theme="light"
							options={FINISHES.map((f) => ({
								value: f.value,
								label: (
									<span className="flex items-center gap-2">
										<span
											className="size-3 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.12)]"
											style={{ background: f.swatch }}
										/>
										{f.label}
									</span>
								),
							}))}
							value={finish}
							onValueChange={(value) => {
								if (isFinish(value)) setFinish(value);
							}}
							height={44}
							aria-label="Finish"
						/>
					</GlassScope>
					<p className="mt-5 text-[15px] text-[#6e6e73]">
						Lumen in {chosen.label}
					</p>
				</Stage>
			</Reveal>
		</section>
	);
}
