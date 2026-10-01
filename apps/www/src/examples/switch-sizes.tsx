import { Switch } from "@liquikit/react";

export default function SwitchSizes() {
	return (
		<div className="flex items-center gap-6">
			<Switch width={52} height={20} aria-label="Small" />
			<Switch defaultChecked aria-label="Regular" />
			<Switch width={96} height={36} defaultChecked aria-label="Large" />
		</div>
	);
}
