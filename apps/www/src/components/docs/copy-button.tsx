import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyButton({
	value,
	className = "",
}: {
	value: () => string;
	className?: string;
}) {
	const [copied, setCopied] = useState(false);
	return (
		<button
			type="button"
			aria-label={copied ? "Copied" : "Copy code"}
			onClick={() => {
				navigator.clipboard.writeText(value());
				setCopied(true);
				setTimeout(() => setCopied(false), 1500);
			}}
			className={`grid size-8 place-items-center rounded-[9px] text-white/50 transition-colors hover:bg-white/10 hover:text-white ${className}`}
		>
			{copied ? <Check className="size-4" /> : <Copy className="size-4" />}
		</button>
	);
}
