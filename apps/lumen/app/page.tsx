import { Design } from "@/components/lumen/design";
import { Hero } from "@/components/lumen/hero";
import { Footer, Specs, Subnav } from "@/components/lumen/sections";
import { LumenProvider } from "@/components/lumen/state";
import { Studio } from "@/components/lumen/studio";
import { FollowTheSun } from "@/components/lumen/sun";

export default function Page() {
	// Panes draw past their edge, so clip the page sideways.
	return (
		<LumenProvider>
			<main id="top" className="overflow-x-clip pt-3">
				<Subnav />
				<Hero />
				<FollowTheSun />
				<Studio />
				<Design />
				<Specs />
				<Footer />
			</main>
		</LumenProvider>
	);
}
