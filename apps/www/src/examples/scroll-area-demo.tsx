import { ScrollArea, Separator } from "@liquikit/react";

const RELEASES = Array.from({ length: 24 }, (_, index) => `v1.${24 - index}.0`);

export default function ScrollAreaDemo() {
	return (
		<ScrollArea className="h-[240px] w-full max-w-[260px] rounded-[18px] bg-black/30 ring-1 ring-white/10">
			<div className="p-4 text-white">
				<p className="mb-3 text-[14px] font-medium">Releases</p>
				{RELEASES.map((release, index) => (
					<div key={release}>
						{index > 0 ? <Separator /> : null}
						<p className="py-2 font-mono text-[13px] text-white/70">
							{release}
						</p>
					</div>
				))}
			</div>
		</ScrollArea>
	);
}
