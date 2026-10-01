import { SegmentedControl } from "@liquikit/react";

export default function SegmentedControlDemo() {
	return (
		<SegmentedControl
			options={["Day", "Week", "Month", "Year"]}
			defaultValue="Week"
			aria-label="Range"
		/>
	);
}
