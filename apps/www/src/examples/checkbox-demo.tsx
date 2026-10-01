import { Checkbox } from "@liquikit/react";

export default function CheckboxDemo() {
	return (
		<div className="flex flex-col gap-3 text-white">
			<Checkbox defaultChecked>Remember me</Checkbox>
			<Checkbox>Send me product news</Checkbox>
		</div>
	);
}
