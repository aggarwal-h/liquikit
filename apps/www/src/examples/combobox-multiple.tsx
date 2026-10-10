"use client";

import { Combobox } from "@liquikit/react";

const TOPPINGS = [
	"Basil",
	"Chilli",
	"Garlic",
	"Mozzarella",
	"Mushroom",
	"Olive",
	"Onion",
	"Pepperoni",
	"Pineapple",
	"Rocket",
	"Tomato",
];

export default function ComboboxMultiple() {
	return (
		<Combobox.Root
			items={TOPPINGS}
			multiple
			defaultValue={["Basil", "Mozzarella"]}
		>
			<Combobox.Chips placeholder="Add toppings" aria-label="Toppings" />
			<Combobox.Popup empty="No toppings found.">
				<Combobox.List>
					{(topping: string) => (
						<Combobox.Item key={topping} value={topping}>
							{topping}
						</Combobox.Item>
					)}
				</Combobox.List>
			</Combobox.Popup>
		</Combobox.Root>
	);
}
