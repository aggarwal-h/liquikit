import { SegmentedControl } from "@liquikit/react";
import { LayoutGrid, List, Rows3 } from "lucide-react";

export default function SegmentedControlIcons() {
	return (
		<SegmentedControl
			options={[
				{
					value: "grid",
					label: <LayoutGrid className="size-4" aria-label="Grid" />,
				},
				{ value: "list", label: <List className="size-4" aria-label="List" /> },
				{
					value: "rows",
					label: <Rows3 className="size-4" aria-label="Rows" />,
				},
			]}
			defaultValue="grid"
			aria-label="Layout"
		/>
	);
}
