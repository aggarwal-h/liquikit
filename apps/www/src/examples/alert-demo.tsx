"use client";

import { Alert } from "@liquikit/react";

export default function AlertDemo() {
	return (
		<Alert.Root>
			<Alert.Trigger>Delete photo…</Alert.Trigger>
			<Alert.Popup>
				<Alert.Title>Delete this photo?</Alert.Title>
				<Alert.Description>
					It will be removed from all your devices.
				</Alert.Description>
				<Alert.Actions>
					<Alert.Close>Cancel</Alert.Close>
					<Alert.Close variant="prominent" tint="#e5484d">
						Delete
					</Alert.Close>
				</Alert.Actions>
			</Alert.Popup>
		</Alert.Root>
	);
}
