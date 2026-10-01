import { GlassPane } from "@liquikit/react";

export default function GlassPaneClear() {
	return (
		<div className="flex flex-wrap items-center justify-center gap-5">
			<GlassPane radius="capsule">
				<p className="px-5 py-2.5 text-[14px] font-medium text-white">
					Regular
				</p>
			</GlassPane>
			<GlassPane radius="capsule" variant="clear">
				<p className="px-5 py-2.5 text-[14px] font-medium text-white">Clear</p>
			</GlassPane>
			<GlassPane radius="capsule" tint="#2160ff" tintOpacity={0.55}>
				<p className="px-5 py-2.5 text-[14px] font-medium text-white">Tinted</p>
			</GlassPane>
		</div>
	);
}
