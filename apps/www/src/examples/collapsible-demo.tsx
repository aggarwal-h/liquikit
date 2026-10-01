import { Collapsible } from "@liquikit/react";

export default function CollapsibleDemo() {
	return (
		<div className="flex w-full max-w-[340px] flex-col items-start gap-3 text-white">
			<Collapsible.Root>
				<Collapsible.Trigger>Advanced settings</Collapsible.Trigger>
				<Collapsible.Panel>
					<p className="pt-3 text-[14px] leading-[1.6] text-white/65">
						Proxy, DNS and the rest of the settings most people never need.
					</p>
				</Collapsible.Panel>
			</Collapsible.Root>
		</div>
	);
}
