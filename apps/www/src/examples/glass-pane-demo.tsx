import { GlassPane } from "@liquikit/react";

export default function GlassPaneDemo() {
	return (
		<GlassPane radius={28}>
			<div className="w-[280px] p-5 text-white">
				<p className="text-[16px] font-semibold">Now boarding</p>
				<p className="mt-1 text-[14px] text-white/65">
					Gate 21 · Flight LU 108 to Lisbon
				</p>
			</div>
		</GlassPane>
	);
}
