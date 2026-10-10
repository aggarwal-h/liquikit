"use client";

import { Tabs } from "@liquikit/react";
import { Heart, House, Search, User } from "lucide-react";
import { useState } from "react";

const TABS = [
	{ value: "home", label: "Home", icon: <House className="size-[22px]" /> },
	{
		value: "search",
		label: "Search",
		icon: <Search className="size-[22px]" />,
	},
	{ value: "saved", label: "Saved", icon: <Heart className="size-[22px]" /> },
	{
		value: "profile",
		label: "Profile",
		icon: <User className="size-[22px]" />,
	},
];

export default function TabsBar() {
	const [tab, setTab] = useState("home");
	return (
		<Tabs.Root value={tab} onValueChange={setTab}>
			<Tabs.Bar tabs={TABS} aria-label="Sections" />
		</Tabs.Root>
	);
}
