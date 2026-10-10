"use client";

import { Popover } from "@liquikit/react";

export default function PopoverDemo() {
	return (
		<Popover.Root>
			<Popover.Trigger variant="prominent">Details</Popover.Trigger>
			<Popover.Popup>
				<Popover.Title>Refraction</Popover.Title>
				<Popover.Description>
					This panel grew out of the button that opened it, and flies back into
					it when it closes.
				</Popover.Description>
				<Popover.Close variant="prominent">Done</Popover.Close>
			</Popover.Popup>
		</Popover.Root>
	);
}
