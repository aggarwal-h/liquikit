import { Switch } from "@liquikit/react";
import { useState } from "react";

export default function SwitchControlled() {
	const [airplane, setAirplane] = useState(false);
	return (
		<div className="flex flex-col items-center gap-3 text-white">
			<Switch
				checked={airplane}
				onCheckedChange={setAirplane}
				aria-label="Airplane mode"
			/>
			<p className="text-[14px] text-white/60">
				Airplane mode is {airplane ? "on" : "off"}
			</p>
		</div>
	);
}
