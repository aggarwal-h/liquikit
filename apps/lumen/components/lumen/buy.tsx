"use client";

import type { ReactNode } from "react";
import { SegmentedControl } from "@/components/liquikit/segmented-control";
import { Sheet } from "@/components/liquikit/sheet";
import { useToast } from "@/components/liquikit/toast";
import { Lamp } from "./lamp";
import { FINISHES, isFinish } from "./light";
import { useLumen } from "./state";

export function BuyButton({
	size = "small",
	className,
	children = "Buy",
}: {
	size?: "small" | "regular" | "large";
	className?: string;
	children?: ReactNode;
}) {
	const toast = useToast();
	const { finish, setFinish } = useLumen();
	const chosen = FINISHES.find((f) => f.value === finish) ?? FINISHES[0];

	return (
		<Sheet.Root>
			<Sheet.Trigger variant="prominent" size={size} className={className}>
				{children}
			</Sheet.Trigger>
			<Sheet.Popup>
				<div className="flex flex-col items-center gap-5 pt-2 text-center">
					<div>
						<Sheet.Title>Buy Lumen</Sheet.Title>
						<Sheet.Description className="text-balance">
							Free delivery in 2–3 days, and free returns for 14 days.
						</Sheet.Description>
					</div>
					<div className="flex h-[190px] w-full items-center justify-center">
						<Lamp kelvin={2900} level={0.62} finish={finish} size="150px" />
					</div>
					<SegmentedControl
						options={FINISHES.map((f) => ({
							value: f.value,
							label: (
								<span className="flex items-center gap-2">
									<span
										className="size-3 rounded-full shadow-[inset_0_0_0_1px_rgb(255_255_255/0.35)]"
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
						aria-label="Finish"
					/>
					<p className="text-[15px] text-(--ink)/70">
						Lumen in {chosen.label} ·{" "}
						<span className="font-semibold text-(--ink)">$249</span>
					</p>
				</div>
				<Sheet.Close
					variant="prominent"
					size="large"
					className="mt-3"
					onClick={() =>
						toast.add({
							title: "Added to your bag",
							description: `Lumen in ${chosen.label}, $249. Delivery in 2–3 days.`,
						})
					}
				>
					Add to Bag
				</Sheet.Close>
			</Sheet.Popup>
		</Sheet.Root>
	);
}
