import { Toggle } from "@liquikit/react";
import { Bold, Italic, Underline } from "lucide-react";

export default function ToggleIcons() {
	return (
		<div className="flex items-center gap-3">
			<Toggle icon defaultPressed aria-label="Bold">
				<Bold className="size-4" />
			</Toggle>
			<Toggle icon aria-label="Italic">
				<Italic className="size-4" />
			</Toggle>
			<Toggle icon variant="clear" aria-label="Underline">
				<Underline className="size-4" />
			</Toggle>
		</div>
	);
}
