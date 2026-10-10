"use client";

import { Select } from "@liquikit/react";

const SIZES = [
	{ value: "small", label: "Small" },
	{ value: "medium", label: "Medium" },
	{ value: "large", label: "Large" },
	{ value: "xl", label: "Extra large" },
];

export default function SelectDemo() {
	return (
		<Select.Root items={SIZES} defaultValue="medium">
			<Select.Trigger aria-label="Text size" />
			<Select.Popup>
				{SIZES.map((size) => (
					<Select.Item key={size.value} value={size.value}>
						{size.label}
					</Select.Item>
				))}
			</Select.Popup>
		</Select.Root>
	);
}
