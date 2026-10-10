"use client";

import { Sheet } from "@liquikit/react";

export default function SheetDemo() {
	return (
		<Sheet.Root>
			<Sheet.Trigger>Share…</Sheet.Trigger>
			<Sheet.Popup>
				<Sheet.Title>Share</Sheet.Title>
				<Sheet.Description>
					A sheet of glass that floats up. Pull it down by its top edge to put
					it away.
				</Sheet.Description>
				<div className="flex flex-col gap-2">
					<Sheet.Close variant="prominent">Copy link</Sheet.Close>
					<Sheet.Close>Cancel</Sheet.Close>
				</div>
			</Sheet.Popup>
		</Sheet.Root>
	);
}
