"use client";

import { Button, Field, Fieldset, Form, Input } from "@liquikit/react";
import { useState } from "react";

export default function FieldForm() {
	const [sent, setSent] = useState(false);
	return (
		<Form
			className="w-full max-w-[420px]"
			onSubmit={(event) => {
				event.preventDefault();
				setSent(true);
			}}
		>
			<Fieldset.Root>
				<Fieldset.Legend>Account</Fieldset.Legend>
				<Field.Root name="name">
					<Field.Label>Name</Field.Label>
					<Input placeholder="Ada Lovelace" required />
					<Field.Error match="valueMissing">Enter a name.</Field.Error>
				</Field.Root>
				<Field.Root name="email">
					<Field.Label>Email</Field.Label>
					<Input type="email" placeholder="ada@example.com" required />
					<Field.Error />
				</Field.Root>
			</Fieldset.Root>
			<Button type="submit" variant="prominent">
				{sent ? "Account created" : "Create account"}
			</Button>
		</Form>
	);
}
