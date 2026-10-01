import { Switch } from "@liquikit/react";

export default function SwitchDemo() {
	return (
		<div className="flex items-center gap-4 text-[15px] font-medium text-white">
			<Switch defaultChecked aria-label="Wi-Fi" />
			Wi-Fi
		</div>
	);
}
