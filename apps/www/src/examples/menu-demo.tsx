import { Menu } from "@liquikit/react";
import { Copy, Pencil, Share, Trash2 } from "lucide-react";

export default function MenuDemo() {
	return (
		<Menu.Root>
			<Menu.Trigger>Options</Menu.Trigger>
			<Menu.Popup>
				<Menu.Item icon={<Copy className="size-4" />}>Copy</Menu.Item>
				<Menu.Item icon={<Pencil className="size-4" />}>Rename</Menu.Item>
				<Menu.Item icon={<Share className="size-4" />}>Share</Menu.Item>
				<Menu.Separator />
				<Menu.Item
					icon={<Trash2 className="size-4" />}
					className="text-[#ff6369]"
				>
					Delete
				</Menu.Item>
			</Menu.Popup>
		</Menu.Root>
	);
}
