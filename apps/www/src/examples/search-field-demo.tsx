import { SearchField } from "@liquikit/react";
import { useState } from "react";

export default function SearchFieldDemo() {
	const [query, setQuery] = useState("");
	return (
		<div className="flex flex-col items-center gap-3">
			<SearchField value={query} onValueChange={setQuery} aria-label="Search" />
			<p className="h-4 text-[13px] text-white/55">
				{query ? `Searching for “${query}”` : ""}
			</p>
		</div>
	);
}
