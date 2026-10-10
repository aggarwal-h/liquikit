"use client";

import { Field, Input } from "@liquikit/react";

export default function FieldDemo() {
	return (
		<div className="w-full max-w-[320px]">
			<Field.Root>
				<Field.Label>Email</Field.Label>
				<Input type="email" placeholder="you@example.com" />
				<Field.Description>For your receipts.</Field.Description>
			</Field.Root>
		</div>
	);
}
