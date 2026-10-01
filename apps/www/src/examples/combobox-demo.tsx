import { Combobox } from "@liquikit/react";

const FRUITS = [
	"Apple",
	"Apricot",
	"Banana",
	"Cherry",
	"Grape",
	"Kiwi",
	"Lemon",
	"Mango",
	"Orange",
	"Peach",
	"Pear",
];

export default function ComboboxDemo() {
	return (
		<Combobox.Root items={FRUITS}>
			<Combobox.Input placeholder="Choose a fruit" aria-label="Fruit" />
			<Combobox.Popup empty="No fruit found.">
				<Combobox.List>
					{(fruit: string) => (
						<Combobox.Item key={fruit} value={fruit}>
							{fruit}
						</Combobox.Item>
					)}
				</Combobox.List>
			</Combobox.Popup>
		</Combobox.Root>
	);
}
