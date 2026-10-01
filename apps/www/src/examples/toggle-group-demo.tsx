import { ToggleGroup } from "@liquikit/react";

export default function ToggleGroupDemo() {
	return (
		<ToggleGroup
			options={["Left", "Center", "Right"]}
			defaultValue={["Left"]}
			aria-label="Alignment"
		/>
	);
}
