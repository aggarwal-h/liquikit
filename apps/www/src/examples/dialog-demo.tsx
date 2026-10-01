import { Dialog, Field, Input } from "@liquikit/react";

export default function DialogDemo() {
	return (
		<Dialog.Root>
			<Dialog.Trigger>Edit profile…</Dialog.Trigger>
			<Dialog.Popup>
				<Dialog.Title>Edit profile</Dialog.Title>
				<Dialog.Description>
					This panel grew out of the button that opened it.
				</Dialog.Description>
				<div className="mt-2 flex flex-col gap-4">
					<Field.Root>
						<Field.Label>Display name</Field.Label>
						<Input defaultValue="Ada Lovelace" />
					</Field.Root>
					<Dialog.Close variant="prominent" block>
						Save
					</Dialog.Close>
				</div>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
