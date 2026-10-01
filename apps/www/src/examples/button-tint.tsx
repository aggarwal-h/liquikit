import { Button } from "@liquikit/react";

export default function ButtonTint() {
	return (
		<div className="flex flex-wrap items-center justify-center gap-3">
			<Button variant="prominent" tint="#1fd68a">
				Accept
			</Button>
			<Button variant="prominent" tint="#ff8a1f">
				Snooze
			</Button>
			<Button variant="prominent" tint="#e5484d">
				Decline
			</Button>
		</div>
	);
}
