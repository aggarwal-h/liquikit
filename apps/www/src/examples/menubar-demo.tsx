"use client";

import { Menu, Menubar } from "@liquikit/react";

export default function MenubarDemo() {
	return (
		<Menubar.Root>
			<Menubar.Menu>
				<Menubar.Trigger>File</Menubar.Trigger>
				<Menubar.Popup>
					<Menu.Item>New Window</Menu.Item>
					<Menu.Item>Open…</Menu.Item>
					<Menu.Separator />
					<Menu.Item>Close</Menu.Item>
				</Menubar.Popup>
			</Menubar.Menu>
			<Menubar.Menu>
				<Menubar.Trigger>Edit</Menubar.Trigger>
				<Menubar.Popup>
					<Menu.Item>Undo</Menu.Item>
					<Menu.Item>Redo</Menu.Item>
					<Menu.Separator />
					<Menu.Item>Copy</Menu.Item>
					<Menu.Item>Paste</Menu.Item>
				</Menubar.Popup>
			</Menubar.Menu>
			<Menubar.Menu>
				<Menubar.Trigger>View</Menubar.Trigger>
				<Menubar.Popup>
					<Menu.CheckboxItem defaultChecked>Sidebar</Menu.CheckboxItem>
					<Menu.CheckboxItem>Toolbar</Menu.CheckboxItem>
				</Menubar.Popup>
			</Menubar.Menu>
		</Menubar.Root>
	);
}
