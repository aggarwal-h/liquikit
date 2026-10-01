import { Radio, RadioGroup } from "@liquikit/react";

export default function RadioDemo() {
	return (
		<div className="text-white">
			<RadioGroup defaultValue="auto" aria-label="Appearance">
				<Radio value="light">Light</Radio>
				<Radio value="dark">Dark</Radio>
				<Radio value="auto">Automatic</Radio>
			</RadioGroup>
		</div>
	);
}
