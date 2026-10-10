"use client";

import { ContextMenu, Menu } from "@liquikit/react";

export default function ContextMenuDemo() {
	return (
		<ContextMenu.Root>
			<ContextMenu.Trigger className="grid h-[180px] w-full max-w-[380px] place-items-center rounded-[20px] border border-dashed border-white/25 text-[14px] text-white/60">
				Right-click, or long-press, here
			</ContextMenu.Trigger>
			<ContextMenu.Popup>
				<Menu.Item>Get Info</Menu.Item>
				<Menu.Item>Rename</Menu.Item>
				<Menu.Item>Duplicate</Menu.Item>
				<Menu.Separator />
				<Menu.Item className="text-[#ff6369]">Move to Trash</Menu.Item>
			</ContextMenu.Popup>
		</ContextMenu.Root>
	);
}
