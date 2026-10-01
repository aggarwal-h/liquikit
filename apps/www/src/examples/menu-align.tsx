import { Menu } from "@liquikit/react";

const ALIGNMENTS = ["start", "center", "end"] as const;

export default function MenuAlign() {
	return (
		<div className="flex flex-wrap items-center justify-center gap-3">
			{ALIGNMENTS.map((align) => (
				<Menu.Root key={align}>
					<Menu.Trigger>{align}</Menu.Trigger>
					<Menu.Popup align={align}>
						<Menu.Item>Copy</Menu.Item>
						<Menu.Item>Rename</Menu.Item>
						<Menu.Item>Share</Menu.Item>
					</Menu.Popup>
				</Menu.Root>
			))}
		</div>
	);
}
