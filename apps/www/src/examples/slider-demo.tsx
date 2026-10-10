import { Slider } from "@liquikit/react";

export default function SliderDemo() {
	return (
		<div className="w-full max-w-[280px]">
			<Slider defaultValue={40} aria-label="Volume" />
		</div>
	);
}
