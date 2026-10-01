import { Slider } from "@liquikit/react";
import { Sun, SunDim } from "lucide-react";
import { useState } from "react";

export default function SliderControlled() {
	const [brightness, setBrightness] = useState(64);
	return (
		<div className="flex flex-col items-center gap-3 text-white/70">
			<div className="flex items-center gap-3">
				<SunDim className="size-4" />
				<Slider
					value={brightness}
					onValueChange={setBrightness}
					width={240}
					aria-label="Brightness"
				/>
				<Sun className="size-[18px]" />
			</div>
			<p className="font-mono text-[13px]">{brightness}%</p>
		</div>
	);
}
