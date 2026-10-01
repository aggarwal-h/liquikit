import { NumberField } from "@liquikit/react";

export default function NumberFieldDemo() {
	return <NumberField label="Guests" defaultValue={2} min={1} max={12} />;
}
