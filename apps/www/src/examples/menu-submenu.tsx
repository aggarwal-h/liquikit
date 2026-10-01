import { Menu } from "@liquikit/react";

export default function MenuSubmenu() {
	return (
		<Menu.Root>
			<Menu.Trigger>File</Menu.Trigger>
			<Menu.Popup>
				<Menu.Item>New Window</Menu.Item>
				<Menu.Item>Open…</Menu.Item>
				<Menu.SubmenuRoot>
					<Menu.SubmenuTrigger>Open Recent</Menu.SubmenuTrigger>
					<Menu.Popup>
						<Menu.Item>Afterglow.fig</Menu.Item>
						<Menu.Item>Blue hour.sketch</Menu.Item>
						<Menu.Item>LiquiKit.key</Menu.Item>
					</Menu.Popup>
				</Menu.SubmenuRoot>
				<Menu.Separator />
				<Menu.Item>Close</Menu.Item>
			</Menu.Popup>
		</Menu.Root>
	);
}
