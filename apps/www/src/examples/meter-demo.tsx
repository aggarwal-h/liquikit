import { Meter } from "@liquikit/react";

export default function MeterDemo() {
	return (
		<div className="flex w-full max-w-[320px] flex-col gap-6">
			<Meter label="Storage" value={72} />
			<Meter label="Battery" value={38} tint="#1fd68a" />
		</div>
	);
}
