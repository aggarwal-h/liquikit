"use client";

import { Accordion } from "@liquikit/react";

export default function AccordionDemo() {
	return (
		<div className="w-full max-w-[360px]">
			<Accordion.Root defaultValue={["wifi"]}>
				<Accordion.Item value="wifi">
					<Accordion.Trigger>Wi-Fi</Accordion.Trigger>
					<Accordion.Panel>
						Connected to Home. Networks you have joined before connect on their
						own.
					</Accordion.Panel>
				</Accordion.Item>
				<Accordion.Item value="bluetooth">
					<Accordion.Trigger>Bluetooth</Accordion.Trigger>
					<Accordion.Panel>Two devices are connected.</Accordion.Panel>
				</Accordion.Item>
				<Accordion.Item value="battery">
					<Accordion.Trigger>Battery</Accordion.Trigger>
					<Accordion.Panel>82%, about 9 hours left.</Accordion.Panel>
				</Accordion.Item>
			</Accordion.Root>
		</div>
	);
}
