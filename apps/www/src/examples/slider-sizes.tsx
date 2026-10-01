import { Slider } from "@liquikit/react";

export default function SliderSizes() {
	return (
		<div className="flex flex-col items-center gap-8">
			<Slider
				defaultValue={30}
				width={240}
				thumbHeight={16}
				aria-label="Small"
			/>
			<Slider defaultValue={50} width={280} aria-label="Regular" />
			<Slider
				defaultValue={70}
				width={320}
				thumbHeight={30}
				trackHeight={8}
				aria-label="Large"
			/>
		</div>
	);
}
