"use client";

import { Menu } from "@liquikit/react";
import { useState } from "react";

export default function MenuOptions() {
	const [view, setView] = useState("icons");
	return (
		<Menu.Root>
			<Menu.Trigger>View</Menu.Trigger>
			<Menu.Popup>
				<Menu.CheckboxItem defaultChecked>Show sidebar</Menu.CheckboxItem>
				<Menu.CheckboxItem>Show path bar</Menu.CheckboxItem>
				<Menu.Separator />
				<Menu.RadioGroup value={view} onValueChange={setView}>
					<Menu.GroupLabel>Show as</Menu.GroupLabel>
					<Menu.RadioItem value="icons">Icons</Menu.RadioItem>
					<Menu.RadioItem value="list">List</Menu.RadioItem>
					<Menu.RadioItem value="columns">Columns</Menu.RadioItem>
				</Menu.RadioGroup>
			</Menu.Popup>
		</Menu.Root>
	);
}
