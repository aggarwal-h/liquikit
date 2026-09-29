type Entry = string | { text: string; default?: string };

const COMMON: Record<string, Entry> = {
	theme:
		"Light or dark glass. Falls back to the nearest `GlassThemeProvider`, then light.",
	lens: "Overrides for the lens profile, such as `thickness`, `bevel`, `ior` and `magnification`.",
	liquid:
		"How far the glass squashes and stretches as it moves. `0` keeps it rigid.",
	refraction: {
		text: "When the glass bends the page. `interactive` bends it while the component is pressed, dragged or focused, `always` bends it all the time.",
		default: '"interactive"',
	},
	open: "Whether the popup is open. Pair it with `onOpenChange` to control it.",
	side: "Which side of the trigger the popup opens on.",
	align: "How the popup lines up with its trigger along that side.",
	sideOffset: "Gap between the trigger and the popup, in pixels.",
	className: "Class names for the outermost element.",
	style: "Inline styles for the outermost element.",
	children: "The content.",
	value: "The current value, when you control it.",
	defaultValue: "The value it starts with, when it manages its own state.",
	onValueChange: "Called with the new value when the user changes it.",
	tint: "Colour of the glass body. Accepts any CSS colour.",
	label: "A visible label, wired to the control for assistive technology.",
	empty: "Shown in the list when nothing matches.",
	container: "Where the popup renders. Defaults to the end of the body.",
	"aria-label": "An accessible name, for controls without a visible label.",
};

const PARTS: Record<string, Entry> = {
	"Button.variant":
		"`glass` is frosted glass, `prominent` fills with the accent, `clear` is glass with no body until pressed.",
	"Button.size": "Height and padding of the button.",
	"Button.icon": "Makes the button square, for a single icon.",
	"Button.block": "Stretches the button to the width of its container.",
	"Toggle.variant":
		"`glass` is frosted glass, `clear` has no body until pressed.",
	"Toggle.size": {
		text: "Height and padding of the toggle.",
		default: '"regular"',
	},
	"Toggle.icon": "Makes the toggle square, for a single icon.",
	"Toggle.tint": "Colour of the glass when pressed.",
	"Switch.width": { text: "Width of the track, in pixels.", default: "74" },
	"Switch.height": { text: "Height of the track, in pixels.", default: "28" },
	"Switch.onCheckedChange": "Called with the new state when the switch flips.",
	"Slider.width": "Width of the track, in pixels.",
	"Slider.trackHeight": "Height of the track, in pixels.",
	"Slider.thumbHeight": "Height of the glass knob, in pixels.",
	"Slider.thumbWidth": "Width of the knob. Defaults to twice its height.",
	"Slider.onValueCommitted": "Called once the user lets go of the knob.",
	"SegmentedControl.options":
		"The segments, as strings or `{ value, label, disabled }` objects.",
	"SegmentedControl.height": "Height of the control, in pixels.",
	"ToggleGroup.options":
		"The toggles, as strings or `{ value, label, disabled }` objects.",
	"ToggleGroup.value": "The pressed toggles, when you control them.",
	"ToggleGroup.defaultValue": "The toggles pressed to begin with.",
	"ToggleGroup.height": "Height of the group, in pixels.",
	"Tabs.List.tabs":
		"The tabs, as strings or `{ value, label, disabled }` objects.",
	"Tabs.List.height": "Height of the tab row, in pixels.",
	"Tabs.Bar.tabs": "The tabs, each with a `value`, a `label` and an `icon`.",
	"Tabs.Bar.height": "Height of the bar, in pixels.",
	"Tabs.Panel.value": "The tab this panel belongs to.",
	"Avatar.src": "URL of the picture.",
	"Avatar.alt": "Describes the picture.",
	"Avatar.fallback":
		"Shown while the picture loads, or if it fails. Usually initials.",
	"Avatar.size": "Diameter, in pixels.",
	"Dialog.Popup.closeButton": "Shows a close button in the corner.",
	"Input.leading": "An icon or text at the start of the field.",
	"OtpField.length": "Number of characters in the code.",
	"OtpField.groupSize":
		"Puts a gap after every so many slots, as in `123 456`.",
	"ScrollArea.horizontal": "Scrolls sideways instead of up and down.",
	"Select.Trigger.placeholder": "Shown until something is chosen.",
	"Meter.tint": "Colour of the filled part. Defaults to the accent.",
	"Progress.tint": "Colour of the filled part. Defaults to the accent.",
	"Toast.Viewport.theme": "Light or dark toasts.",
	"Combobox.Chips.placeholder": "Shown while nothing is chosen.",
	"Combobox.Chips.chipLabel":
		"Renders the label inside each chip. Defaults to the item, or its `label`.",
	"GlassPane.radius":
		"Corner radius in pixels, or `capsule` for fully round ends.",
	"GlassPane.variant":
		"`regular` is frosted with a tinted body. `clear` is nearly transparent, so the refraction shows most.",
	"GlassPane.tint":
		"Colour of the body. Defaults to white in light and a dark grey in dark.",
	"GlassPane.tintOpacity":
		"Opacity of the body, from 0 to 1. Overrides the variant.",
	"GlassPane.press":
		"A motion value from 0 to 1. At 1 the pane swells and brightens, as if pressed.",
	"GlassPane.frost":
		"A motion value from 0 to 1 that fades the frost and the body, leaving clear glass.",
	"GlassPane.shape":
		"Motion values for the lens's centre, size and radius, when it should move inside the pane.",
	"GlassPane.reach":
		"Extra room around the pane the lens may grow into, per side.",
	"GlassPane.liquid": {
		text: "How far the glass squashes and stretches as it moves. `0` keeps it rigid.",
		default: "0.6",
	},
	"GlassThemeProvider.theme": "The theme for every glass component inside it.",
	"GlassScope.backdrop":
		"The background of this area, drawn behind the content. Glass in the scope bends a copy of it.",
};

export function describe(part: string, prop: string) {
	const entry = PARTS[`${part}.${prop}`] ?? COMMON[prop];
	if (!entry) return { text: undefined, default: undefined };
	return typeof entry === "string"
		? { text: entry, default: undefined }
		: entry;
}
