import { Input } from "@liquikit/react";
import { AtSign } from "lucide-react";

export default function FieldLeading() {
	return (
		<div className="w-full max-w-[320px]">
			<Input
				leading={<AtSign className="size-4" />}
				placeholder="username"
				aria-label="Username"
			/>
		</div>
	);
}
