import { Avatar } from "@liquikit/react";

const PORTRAIT =
	"data:image/svg+xml;utf8," +
	encodeURIComponent(
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6fe3ff"/><stop offset="1" stop-color="#2160ff"/></linearGradient></defs><rect width="80" height="80" fill="url(#g)"/><circle cx="40" cy="32" r="14" fill="#fff" fill-opacity=".9"/><path d="M14 80c2-16 13-24 26-24s24 8 26 24z" fill="#fff" fill-opacity=".9"/></svg>`,
	);

export default function AvatarDemo() {
	return (
		<div className="flex items-center gap-4">
			<Avatar src={PORTRAIT} alt="Maya" size={56} />
			<Avatar fallback="HA" size={48} />
			<Avatar fallback="TC" size={40} />
			<Avatar fallback="JI" size={32} />
		</div>
	);
}
