import { ToggleGroup } from "@liquikit/react";

export default function ToggleGroupMultiple() {
	return (
		<ToggleGroup
			multiple
			options={[
				{ value: "bold", label: "Bold" },
				{ value: "italic", label: "Italic" },
				{ value: "underline", label: "Underline" },
			]}
			defaultValue={["bold"]}
			aria-label="Style"
		/>
	);
}
