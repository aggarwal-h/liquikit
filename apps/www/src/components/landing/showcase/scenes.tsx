import {
	Button,
	Combobox,
	GlassPane,
	Menu,
	SegmentedControl,
	Select,
	Slider,
	Switch,
	Tabs,
	Toast,
	Toggle,
	Toolbar,
	useToast,
} from "@liquikit/react";
import {
	AlignCenter,
	AlignLeft,
	AlignRight,
	Bluetooth,
	Bold,
	Camera,
	Ellipsis,
	Flashlight,
	FolderPlus,
	Heart,
	Image,
	Italic,
	Link,
	ListMusic,
	Moon,
	Pause,
	Plane,
	Play,
	Search,
	Share,
	SkipBack,
	SkipForward,
	Sparkles,
	Sun,
	SunDim,
	Trash2,
	Underline,
	Volume1,
	Volume2,
	Wifi,
} from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useWidth } from "@/lib/use-width";
import { CityMap, CoverArt, Horizon, MiniCover, PhotoGrid, Waves } from "./art";
import { Canvas } from "./canvas";

export function Player({ className }: { className?: string }) {
	const [playing, setPlaying] = useState(true);
	const [track, trackWidth] = useWidth<HTMLDivElement>(380);
	const [volume, volumeWidth] = useWidth<HTMLDivElement>(300);
	return (
		<Canvas
			className={className}
			stageClassName="h-[540px]"
			title="Now playing"
			text="A player floating over its own album art. The panel bends the cover behind it, and the menu pours out of its button."
			parts={["slider", "button", "menu"]}
			art={<CoverArt />}
		>
			<div className="absolute inset-x-0 bottom-0 flex justify-center p-4 sm:p-7">
				<GlassPane radius={36} className="w-full max-w-[460px]">
					<div className="p-5 sm:p-6">
						<div className="flex items-center gap-3.5">
							<MiniCover className="size-[54px] shrink-0 rounded-[12px]" />
							<div className="min-w-0 flex-1">
								<p className="truncate text-[17px] font-semibold">Afterglow</p>
								<p className="truncate text-[14px] text-white/60">
									LiquiKit Sessions
								</p>
							</div>
							<Menu.Root>
								<Menu.Trigger icon aria-label="More">
									<Ellipsis className="size-[18px]" />
								</Menu.Trigger>
								<Menu.Popup>
									<Menu.Item icon={<ListMusic className="size-4" />}>
										Add to playlist
									</Menu.Item>
									<Menu.Item icon={<Heart className="size-4" />}>
										Love
									</Menu.Item>
									<Menu.Item icon={<Link className="size-4" />}>
										Copy link
									</Menu.Item>
									<Menu.Separator />
									<Menu.Item icon={<Share className="size-4" />}>
										Share…
									</Menu.Item>
								</Menu.Popup>
							</Menu.Root>
						</div>
						<div ref={track} className="mt-5">
							<Slider
								defaultValue={34}
								width={trackWidth}
								aria-label="Position"
							/>
							<div className="mt-1.5 flex justify-between font-mono text-[11px] text-white/45">
								<span>1:12</span>
								<span>−2:31</span>
							</div>
						</div>
						<div className="mt-1 flex items-center justify-center gap-6">
							<Button variant="clear" icon aria-label="Previous">
								<SkipBack className="size-5 fill-current" />
							</Button>
							<Button
								variant="prominent"
								size="large"
								icon
								aria-label={playing ? "Pause" : "Play"}
								onClick={() => setPlaying(!playing)}
							>
								{playing ? (
									<Pause className="size-5 fill-current" />
								) : (
									<Play className="size-5 fill-current" />
								)}
							</Button>
							<Button variant="clear" icon aria-label="Next">
								<SkipForward className="size-5 fill-current" />
							</Button>
						</div>
						<div className="mt-4 flex items-center gap-3 text-white/55">
							<Volume1 className="size-4 shrink-0" />
							<div ref={volume} className="min-w-0 flex-1">
								<Slider
									defaultValue={62}
									width={volumeWidth}
									aria-label="Volume"
								/>
							</div>
							<Volume2 className="size-4 shrink-0" />
						</div>
					</div>
				</GlassPane>
			</div>
		</Canvas>
	);
}

export function ControlCenter({ className }: { className?: string }) {
	const [wifi, setWifi] = useState(true);
	const [bluetooth, setBluetooth] = useState(false);
	const [brightness, setBrightness] = useState(64);
	const [row, rowWidth] = useWidth<HTMLDivElement>(260);
	return (
		<Canvas
			className={className}
			stageClassName="h-[540px]"
			title="Control center"
			text="Switches you can drag, toggles that light up and a slider that stretches as you pull it, over a sunset they refract."
			parts={["switch", "toggle", "slider", "segmented-control"]}
			art={<Horizon />}
		>
			<div className="flex h-full items-center justify-center p-5">
				<div className="grid w-full max-w-[360px] grid-cols-2 gap-3">
					<GlassPane radius={30} className="col-span-2">
						<div className="flex flex-col gap-4 p-5">
							<Setting icon={<Wifi className="size-4" />} label="Wi-Fi">
								<Switch
									checked={wifi}
									onCheckedChange={setWifi}
									aria-label="Wi-Fi"
								/>
							</Setting>
							<Setting
								icon={<Bluetooth className="size-4" />}
								label="Bluetooth"
							>
								<Switch
									checked={bluetooth}
									onCheckedChange={setBluetooth}
									aria-label="Bluetooth"
								/>
							</Setting>
						</div>
					</GlassPane>
					<GlassPane radius={30}>
						<div className="flex flex-col items-start gap-3 p-4">
							<Toggle icon defaultPressed aria-label="Focus">
								<Moon className="size-[18px]" />
							</Toggle>
							<p className="text-[14px] font-medium">Focus</p>
						</div>
					</GlassPane>
					<GlassPane radius={30}>
						<div className="flex flex-col items-start gap-3 p-4">
							<Toggle icon aria-label="Airplane mode">
								<Plane className="size-[18px]" />
							</Toggle>
							<p className="text-[14px] font-medium">Airplane</p>
						</div>
					</GlassPane>
					<GlassPane radius={30} className="col-span-2">
						<div className="flex items-center gap-3 px-5 py-4 text-white/60">
							<SunDim className="size-4 shrink-0" />
							<div ref={row} className="min-w-0 flex-1">
								<Slider
									value={brightness}
									onValueChange={setBrightness}
									width={rowWidth}
									aria-label="Brightness"
								/>
							</div>
							<Sun className="size-[18px] shrink-0" />
						</div>
					</GlassPane>
					<div className="col-span-2 flex justify-center pt-1">
						<SegmentedControl
							options={["Light", "Dark", "Auto"]}
							defaultValue="Dark"
							aria-label="Appearance"
						/>
					</div>
				</div>
			</div>
		</Canvas>
	);
}

function Setting({
	icon,
	label,
	children,
}: {
	icon: ReactNode;
	label: string;
	children: ReactNode;
}) {
	return (
		<div className="flex items-center justify-between gap-4">
			<span className="flex items-center gap-3 text-[15px] font-medium">
				<span className="grid size-8 place-items-center rounded-full bg-[var(--glass-accent)] text-white">
					{icon}
				</span>
				{label}
			</span>
			{children}
		</div>
	);
}

const LIBRARY_TABS = [
	{
		value: "library",
		label: "Library",
		icon: <Image className="size-[22px]" />,
	},
	{
		value: "for-you",
		label: "For You",
		icon: <Sparkles className="size-[22px]" />,
	},
	{
		value: "albums",
		label: "Albums",
		icon: <FolderPlus className="size-[22px]" />,
	},
	{
		value: "search",
		label: "Search",
		icon: <Search className="size-[22px]" />,
	},
];

export function Photos({ className }: { className?: string }) {
	const [tab, setTab] = useState("library");
	return (
		<Canvas
			className={className}
			stageClassName="h-[480px]"
			title="Photos"
			text="A tab bar and a menu over a scrolling library. The lens bends every tile it passes."
			parts={["tabs", "menu", "button"]}
			art={<PhotoGrid className="absolute inset-0 -top-6" />}
		>
			<div className="flex items-start justify-between p-4">
				<GlassPane radius="capsule">
					<p className="px-4 py-2 text-[15px] font-semibold">Library</p>
				</GlassPane>
				<Menu.Root>
					<Menu.Trigger icon aria-label="Options">
						<Ellipsis className="size-[18px]" />
					</Menu.Trigger>
					<Menu.Popup>
						<Menu.Item icon={<Share className="size-4" />}>Share</Menu.Item>
						<Menu.Item icon={<FolderPlus className="size-4" />}>
							Add to album
						</Menu.Item>
						<Menu.Item icon={<Heart className="size-4" />}>Favourite</Menu.Item>
						<Menu.Separator />
						<Menu.Item
							icon={<Trash2 className="size-4" />}
							className="text-[#ff6369]"
						>
							Delete
						</Menu.Item>
					</Menu.Popup>
				</Menu.Root>
			</div>
			<Tabs.Root value={tab} onValueChange={setTab}>
				<div className="absolute inset-x-0 bottom-5 flex justify-center">
					<Tabs.Bar tabs={LIBRARY_TABS} aria-label="Photos" />
				</div>
			</Tabs.Root>
		</Canvas>
	);
}

const NOTES = [
	{ title: "Maya", description: "Are we still on for seven?" },
	{ title: "Calendar", description: "Design review in 15 minutes" },
	{ title: "Photos", description: "Your memory “Blue hour” is ready" },
	{ title: "Weather", description: "Clear skies tonight, 18°" },
];

export function LockScreen({ className }: { className?: string }) {
	return (
		<Toast.Provider limit={3}>
			<LockScreenStage className={className} />
		</Toast.Provider>
	);
}

function LockScreenStage({ className }: { className?: string }) {
	const toast = useToast();
	const manager = useRef(toast);
	manager.current = toast;
	const [container, setContainer] = useState<HTMLDivElement | null>(null);
	const sent = useRef(0);
	const watch = useRef<HTMLDivElement>(null);

	const notify = () => {
		toast.add({ ...NOTES[sent.current % NOTES.length], timeout: 7000 });
		sent.current += 1;
	};

	useEffect(() => {
		const element = watch.current;
		if (!element) return;
		let timer: ReturnType<typeof setTimeout> | undefined;
		const observer = new IntersectionObserver(
			([entry]) => {
				if (!entry.isIntersecting || sent.current > 0) return;
				observer.disconnect();
				sent.current = 2;
				manager.current.add({ ...NOTES[0], timeout: 0 });
				timer = setTimeout(
					() => manager.current.add({ ...NOTES[1], timeout: 0 }),
					700,
				);
			},
			{ threshold: 0.6 },
		);
		observer.observe(element);
		return () => {
			observer.disconnect();
			clearTimeout(timer);
		};
	}, []);

	return (
		<Canvas
			className={className}
			stageClassName="h-[480px]"
			title="Notifications"
			text="Toasts from the registry, stacking over a lock screen. Swipe one up to dismiss it."
			parts={["toast", "button"]}
			art={<Waves />}
		>
			<div ref={watch} className="flex flex-col items-center pt-9 text-white">
				<p className="text-[15px] font-medium text-white/75">
					Saturday, 26 September
				</p>
				<p className="mt-0.5 text-[76px] leading-none font-semibold tracking-[-0.04em]">
					9:41
				</p>
			</div>
			<div
				ref={setContainer}
				className="lock-toasts absolute inset-x-0 top-[150px] bottom-[84px]"
			/>
			{container ? <Toast.Viewport container={container} /> : null}
			<div className="absolute inset-x-0 bottom-5 flex items-center justify-between px-6">
				<Button icon aria-label="Flashlight">
					<Flashlight className="size-[18px]" />
				</Button>
				<Button variant="prominent" size="small" onClick={notify}>
					Send one
				</Button>
				<Button icon aria-label="Camera">
					<Camera className="size-[18px]" />
				</Button>
			</div>
		</Canvas>
	);
}

const PLACES = [
	"Blue Bottle Coffee",
	"Harbour Studio",
	"LiquiKit Gallery",
	"Pier 7",
	"Riverside Park",
	"The Glasshouse",
	"Union Station",
];

export function Maps({ className }: { className?: string }) {
	return (
		<Canvas
			className={className}
			stageClassName="h-[480px]"
			title="Maps"
			text="A search field that opens into a list, and a route card over the streets and river it bends."
			parts={["combobox", "button"]}
			art={<CityMap />}
		>
			<div className="flex justify-center p-4">
				<Combobox.Root items={PLACES}>
					<Combobox.Input
						placeholder="Search Maps"
						aria-label="Search places"
					/>
					<Combobox.Popup empty="No places found.">
						<Combobox.List>
							{(place: string) => (
								<Combobox.Item key={place} value={place}>
									{place}
								</Combobox.Item>
							)}
						</Combobox.List>
					</Combobox.Popup>
				</Combobox.Root>
			</div>
			<div className="absolute inset-x-0 bottom-0 p-4">
				<GlassPane radius={28} className="w-full">
					<div className="flex items-center gap-4 p-4 pl-5">
						<div className="min-w-0 flex-1">
							<p className="text-[17px] font-semibold">18 min</p>
							<p className="truncate text-[13px] text-white/60">
								4.2 km · via Harbour Street
							</p>
						</div>
						<Button variant="prominent">Go</Button>
					</div>
				</GlassPane>
			</div>
		</Canvas>
	);
}

const FONTS = [
	{ value: "geist", label: "Geist" },
	{ value: "inter", label: "Inter" },
	{ value: "serif", label: "Newsreader" },
	{ value: "mono", label: "Geist Mono" },
];

export function Editor({ className }: { className?: string }) {
	const [size, setSize] = useState(88);
	const [align, setAlign] = useState("Left");
	const [row, rowWidth] = useWidth<HTMLDivElement>(220);
	return (
		<Canvas
			className={className}
			stageClassName="h-[620px] md:h-[500px]"
			title="Design tool"
			text="A formatting toolbar and an inspector made of selects, sliders and switches, floating over the page they edit."
			parts={["toolbar", "select", "slider", "segmented-control", "switch"]}
			art={<Page />}
		>
			<div className="relative h-full">
				<div
					className="absolute top-[92px] right-6 left-6 md:right-[380px] md:left-14"
					style={{ textAlign: align.toLowerCase() as "left" }}
				>
					<p
						className="font-semibold tracking-[-0.045em] text-white transition-[font-size] duration-300"
						style={{
							fontSize: `clamp(40px, ${size / 16}vw, ${size}px)`,
							lineHeight: 1,
						}}
					>
						Design with{" "}
						<span className="relative inline-block">
							<span className="absolute -inset-x-1.5 -inset-y-1 rounded-[3px] bg-[#2160ff]/30 ring-2 ring-[#5b8cff]" />
							<span className="relative">light.</span>
						</span>
					</p>
					<div className="mt-8 flex flex-col gap-2.5">
						{[92, 84, 88, 61].map((width) => (
							<span
								key={width}
								className="h-2.5 rounded-full bg-white/[0.14]"
								style={{ width: `${width}%` }}
							/>
						))}
					</div>
				</div>
				<div className="absolute top-5 left-6 md:left-14">
					<Toolbar.Root aria-label="Formatting">
						<Toolbar.Group>
							<Toolbar.Button icon aria-label="Bold">
								<Bold className="size-4" />
							</Toolbar.Button>
							<Toolbar.Button icon aria-label="Italic">
								<Italic className="size-4" />
							</Toolbar.Button>
							<Toolbar.Button icon aria-label="Underline">
								<Underline className="size-4" />
							</Toolbar.Button>
						</Toolbar.Group>
						<Toolbar.Separator />
						<Toolbar.Button icon aria-label="Link">
							<Link className="size-4" />
						</Toolbar.Button>
					</Toolbar.Root>
				</div>
				<div className="absolute inset-x-4 bottom-4 md:inset-x-auto md:top-5 md:right-5 md:bottom-5">
					<GlassPane radius={30} className="h-full w-full md:w-[330px]">
						<div className="flex h-full flex-col gap-5 p-5">
							<p className="text-[13px] font-medium tracking-wide text-white/50 uppercase">
								Text
							</p>
							<Row label="Typeface">
								<Select.Root items={FONTS} defaultValue="geist">
									<Select.Trigger aria-label="Typeface" size="small" />
									<Select.Popup>
										{FONTS.map((font) => (
											<Select.Item key={font.value} value={font.value}>
												{font.label}
											</Select.Item>
										))}
									</Select.Popup>
								</Select.Root>
							</Row>
							<div>
								<div className="flex items-baseline justify-between text-[14px]">
									<span className="text-white/75">Size</span>
									<span className="font-mono text-[12px] text-white/50">
										{size}px
									</span>
								</div>
								<div ref={row} className="mt-3">
									<Slider
										value={size}
										onValueChange={setSize}
										min={48}
										max={112}
										width={rowWidth}
										aria-label="Size"
									/>
								</div>
							</div>
							<Row label="Align">
								<SegmentedControl
									options={[
										{
											value: "Left",
											label: <AlignLeft className="size-4" aria-label="Left" />,
										},
										{
											value: "Center",
											label: (
												<AlignCenter className="size-4" aria-label="Center" />
											),
										},
										{
											value: "Right",
											label: (
												<AlignRight className="size-4" aria-label="Right" />
											),
										},
									]}
									value={align}
									onValueChange={setAlign}
									aria-label="Alignment"
								/>
							</Row>
							<Row label="Glow">
								<Switch defaultChecked aria-label="Glow" />
							</Row>
						</div>
					</GlassPane>
				</div>
			</div>
		</Canvas>
	);
}

function Row({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className="flex items-center justify-between gap-3 text-[14px]">
			<span className="text-white/75">{label}</span>
			{children}
		</div>
	);
}

function Page() {
	return (
		<div className="absolute inset-0 bg-[radial-gradient(90%_120%_at_80%_20%,#1d4dff_0%,#081a66_35%,#020617_70%)]">
			<div
				className="absolute inset-0 opacity-60"
				style={{
					backgroundImage:
						"radial-gradient(rgb(255 255 255 / 0.22) 1px, transparent 1px)",
					backgroundSize: "22px 22px",
				}}
			/>
			<div className="absolute right-[5%] bottom-[-18%] size-[420px] rounded-full bg-[conic-gradient(from_200deg,#6fe3ff,#2160ff,#7a5cff,#ff5fb0,#6fe3ff)] opacity-90" />
			<div className="absolute right-[12%] bottom-[2%] size-[220px] rounded-full border-2 border-white/60" />
		</div>
	);
}
