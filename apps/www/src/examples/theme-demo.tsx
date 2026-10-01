import { Button, GlassThemeProvider, Switch } from "@liquikit/react";

export default function ThemeDemo() {
	return (
		<div className="flex flex-wrap items-center justify-center gap-8">
			<GlassThemeProvider theme="light">
				<div className="flex items-center gap-3">
					<Button>Light</Button>
					<Switch defaultChecked aria-label="Light switch" />
				</div>
			</GlassThemeProvider>
			<GlassThemeProvider theme="dark">
				<div className="flex items-center gap-3">
					<Button>Dark</Button>
					<Switch defaultChecked aria-label="Dark switch" />
				</div>
			</GlassThemeProvider>
		</div>
	);
}
