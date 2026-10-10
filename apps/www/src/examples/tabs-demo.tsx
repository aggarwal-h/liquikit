"use client";

import { Tabs } from "@liquikit/react";

export default function TabsDemo() {
	return (
		<div className="w-full max-w-[380px] text-white">
			<Tabs.Root defaultValue="overview">
				<Tabs.List
					tabs={["Overview", "Activity", "Settings"].map((label) => ({
						value: label.toLowerCase(),
						label,
					}))}
					aria-label="Account"
				/>
				<Tabs.Panel value="overview" className="mt-5 text-[14px] text-white/65">
					Your plan renews on the first of every month.
				</Tabs.Panel>
				<Tabs.Panel value="activity" className="mt-5 text-[14px] text-white/65">
					Three sign-ins this week, all from this device.
				</Tabs.Panel>
				<Tabs.Panel value="settings" className="mt-5 text-[14px] text-white/65">
					Notifications are on for mentions only.
				</Tabs.Panel>
			</Tabs.Root>
		</div>
	);
}
