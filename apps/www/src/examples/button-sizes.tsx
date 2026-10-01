import { Button } from "@liquikit/react";

export default function ButtonSizes() {
	return (
		<div className="flex flex-wrap items-center justify-center gap-3">
			<Button size="small">Small</Button>
			<Button>Regular</Button>
			<Button size="large">Large</Button>
		</div>
	);
}
