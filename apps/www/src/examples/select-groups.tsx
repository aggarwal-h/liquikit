import { Select } from "@liquikit/react";

const FONTS = [
	{ value: "geist", label: "Geist" },
	{ value: "inter", label: "Inter" },
	{ value: "newsreader", label: "Newsreader" },
	{ value: "fraunces", label: "Fraunces" },
];

export default function SelectGroups() {
	return (
		<Select.Root items={FONTS} defaultValue="geist">
			<Select.Trigger aria-label="Typeface" />
			<Select.Popup>
				<Select.Group>
					<Select.GroupLabel>Sans serif</Select.GroupLabel>
					<Select.Item value="geist">Geist</Select.Item>
					<Select.Item value="inter">Inter</Select.Item>
				</Select.Group>
				<Select.Separator />
				<Select.Group>
					<Select.GroupLabel>Serif</Select.GroupLabel>
					<Select.Item value="newsreader">Newsreader</Select.Item>
					<Select.Item value="fraunces">Fraunces</Select.Item>
				</Select.Group>
			</Select.Popup>
		</Select.Root>
	);
}
