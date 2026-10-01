import { Checkbox, CheckboxGroup } from "@liquikit/react";

export default function CheckboxGroupDemo() {
	return (
		<div className="text-white">
			<CheckboxGroup
				defaultValue={["mail"]}
				allValues={["mail", "photos", "music"]}
			>
				<Checkbox parent>Notify for all apps</Checkbox>
				<div className="flex flex-col gap-3 pl-8">
					<Checkbox value="mail">Mail</Checkbox>
					<Checkbox value="photos">Photos</Checkbox>
					<Checkbox value="music">Music</Checkbox>
				</div>
			</CheckboxGroup>
		</div>
	);
}
