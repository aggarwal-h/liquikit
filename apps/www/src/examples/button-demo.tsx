import { Button } from "@liquikit/react";

export default function ButtonDemo() {
	return (
		<div className="flex flex-wrap items-center justify-center gap-3">
			<Button>Glass</Button>
			<Button variant="prominent">Prominent</Button>
			<Button variant="clear">Clear</Button>
		</div>
	);
}
