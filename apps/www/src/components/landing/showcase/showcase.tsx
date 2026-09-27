import {
	ControlCenter,
	Editor,
	LockScreen,
	Maps,
	Photos,
	Player,
} from "./scenes";

export function Showcase() {
	return (
		<section
			id="components"
			className="relative mx-auto max-w-[1248px] scroll-mt-10 px-4 pt-8 pb-28 sm:px-6"
		>
			<div className="mx-auto max-w-[760px] text-center">
				<h2 className="text-[clamp(34px,5vw,60px)] leading-[1.04] font-semibold tracking-[-0.04em] text-balance">
					Every control, in glass
				</h2>
				<p className="mx-auto mt-5 max-w-[560px] text-[17px] leading-[1.55] text-white/55 text-balance">
					Built from the LiquiKit registry and fully interactive. Drag the
					sliders, flip the switches, open the menus.
				</p>
			</div>
			<div className="mt-16 grid grid-cols-1 gap-x-5 gap-y-12 lg:grid-cols-12">
				<Player className="lg:col-span-7" />
				<ControlCenter className="lg:col-span-5" />
				<Photos className="lg:col-span-4" />
				<LockScreen className="lg:col-span-4" />
				<Maps className="lg:col-span-4" />
				<Editor className="lg:col-span-12" />
			</div>
		</section>
	);
}
