import { Toggle } from "@liquikit/react";

export default function ToggleDemo() {
	return (
		<div className="flex items-center gap-3">
			<Toggle defaultPressed>Wi-Fi</Toggle>
			<Toggle>Bluetooth</Toggle>
		</div>
	);
}
