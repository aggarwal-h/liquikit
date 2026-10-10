"use client";

import { Tooltip } from "@liquikit/react";
import { Heart, Share, Trash2 } from "lucide-react";

export default function TooltipDemo() {
	return (
		<Tooltip.Provider>
			<div className="flex items-center gap-3">
				<Tooltip.Root>
					<Tooltip.Trigger icon aria-label="Share">
						<Share className="size-[18px]" />
					</Tooltip.Trigger>
					<Tooltip.Popup>Share</Tooltip.Popup>
				</Tooltip.Root>
				<Tooltip.Root>
					<Tooltip.Trigger icon aria-label="Favourite">
						<Heart className="size-[18px]" />
					</Tooltip.Trigger>
					<Tooltip.Popup>Favourite</Tooltip.Popup>
				</Tooltip.Root>
				<Tooltip.Root>
					<Tooltip.Trigger icon aria-label="Delete">
						<Trash2 className="size-[18px]" />
					</Tooltip.Trigger>
					<Tooltip.Popup>Delete</Tooltip.Popup>
				</Tooltip.Root>
			</div>
		</Tooltip.Provider>
	);
}
