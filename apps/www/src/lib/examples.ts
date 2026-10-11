import { site } from "./site";

export type Example = {
	slug: string;
	title: string;
	tagline: string;
	description: string;
	image: string;
	alt: string;
	url: string;
	source: string;
	stack: string;
	parts: string[];
};

// Finished pages built with the registry, each a real app in the repository.
export const examples: Example[] = [
	{
		slug: "lumen",
		title: "Lumen",
		tagline: "A product page for a smart lamp.",
		description:
			"A launch page for a made-up lamp, in the style of a hardware product site. A scene picker sits under the hero lamp, a slider drags the lamp through a day of light, a control tile holds switches and sliders for brightness and colour, a finish picker sits on a pale wall, and a sheet with a toast handles buying. Every control sits in the lamp's light, so the glass always has something to bend.",
		image: "/examples/lumen.jpg",
		alt: "The Lumen product page: a glowing lamp with a scene picker beneath it.",
		url: site.lumen,
		source: `${site.github}/tree/main/apps/lumen`,
		stack: "Next.js",
		parts: [
			"glass",
			"segmented-control",
			"slider",
			"switch",
			"sheet",
			"button",
			"toast",
		],
	},
];
