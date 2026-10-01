import { NavigationMenu } from "@liquikit/react";

export default function NavigationMenuDemo() {
	return (
		<NavigationMenu.Root>
			<NavigationMenu.List aria-label="Main">
				<NavigationMenu.Item>
					<NavigationMenu.Trigger>Products</NavigationMenu.Trigger>
					<NavigationMenu.Content>
						<div className="grid w-[420px] grid-cols-2 gap-1">
							<NavigationMenu.Link
								href="#"
								title="Laptops"
								description="Light enough to carry everywhere."
							/>
							<NavigationMenu.Link
								href="#"
								title="Phones"
								description="Designed to be held."
							/>
							<NavigationMenu.Link
								href="#"
								title="Tablets"
								description="Touch, draw and type."
							/>
							<NavigationMenu.Link
								href="#"
								title="Watches"
								description="Time, and everything else."
							/>
						</div>
					</NavigationMenu.Content>
				</NavigationMenu.Item>
				<NavigationMenu.Item>
					<NavigationMenu.Trigger>Resources</NavigationMenu.Trigger>
					<NavigationMenu.Content>
						<div className="flex w-[240px] flex-col gap-1">
							<NavigationMenu.Link href="#" title="Guides" />
							<NavigationMenu.Link href="#" title="Changelog" />
						</div>
					</NavigationMenu.Content>
				</NavigationMenu.Item>
				<NavigationMenu.Item>
					<NavigationMenu.Link href="#">Support</NavigationMenu.Link>
				</NavigationMenu.Item>
			</NavigationMenu.List>
		</NavigationMenu.Root>
	);
}
