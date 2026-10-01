import { Autocomplete } from "@liquikit/react";

const CITIES = [
	"Amsterdam",
	"Berlin",
	"Copenhagen",
	"Lisbon",
	"London",
	"Madrid",
	"Oslo",
	"Paris",
	"Rome",
	"Stockholm",
	"Vienna",
];

export default function AutocompleteDemo() {
	return (
		<Autocomplete.Root items={CITIES}>
			<Autocomplete.Input placeholder="Search cities" aria-label="City" />
			<Autocomplete.Popup empty="No city found.">
				<Autocomplete.List>
					{(city: string) => (
						<Autocomplete.Item key={city} value={city}>
							{city}
						</Autocomplete.Item>
					)}
				</Autocomplete.List>
			</Autocomplete.Popup>
		</Autocomplete.Root>
	);
}
