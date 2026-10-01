import { Toolbar } from "@liquikit/react";
import { Bold, Copy, Italic, Link, Underline } from "lucide-react";

export default function ToolbarDemo() {
	return (
		<Toolbar.Root aria-label="Formatting">
			<Toolbar.Group>
				<Toolbar.Button icon aria-label="Bold">
					<Bold className="size-4" />
				</Toolbar.Button>
				<Toolbar.Button icon aria-label="Italic">
					<Italic className="size-4" />
				</Toolbar.Button>
				<Toolbar.Button icon aria-label="Underline">
					<Underline className="size-4" />
				</Toolbar.Button>
			</Toolbar.Group>
			<Toolbar.Separator />
			<Toolbar.Button icon aria-label="Link">
				<Link className="size-4" />
			</Toolbar.Button>
			<Toolbar.Button icon aria-label="Copy">
				<Copy className="size-4" />
			</Toolbar.Button>
		</Toolbar.Root>
	);
}
