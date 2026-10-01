import { Avatar, PreviewCard } from "@liquikit/react";

export default function PreviewCardDemo() {
	return (
		<p className="max-w-[340px] text-[15px] leading-[1.6] text-white/70">
			Read about{" "}
			<PreviewCard.Root>
				<PreviewCard.Trigger href="#">Liquid glass</PreviewCard.Trigger>
				<PreviewCard.Popup>
					<Avatar fallback="LG" size={40} />
					<p className="m-0 text-[15px] font-semibold">Liquid glass</p>
					<p className="m-0 text-[13px] leading-[1.5] text-white/60">
						A material that bends what is behind it and reshapes itself as you
						use it.
					</p>
				</PreviewCard.Popup>
			</PreviewCard.Root>{" "}
			before you design with it.
		</p>
	);
}
