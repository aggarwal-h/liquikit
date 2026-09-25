import { useId } from "react";

export function Logo({
	className = "",
	mono = false,
}: {
	className?: string;
	mono?: boolean;
}) {
	const id = useId();
	return (
		<span
			className={`inline-flex items-center gap-2 font-semibold tracking-[-0.02em] ${className}`}
		>
			<svg
				viewBox="0 0 32 32"
				className={mono ? "size-[1.15em]" : "size-6"}
				aria-hidden="true"
			>
				<defs>
					<linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
						<stop offset="0" stopColor="#8f8cff" />
						<stop offset="1" stopColor="#ff8fc1" />
					</linearGradient>
				</defs>
				{mono ? (
					<path
						fill="currentColor"
						fillRule="evenodd"
						d="M9 0h14a9 9 0 0 1 9 9v14a9 9 0 0 1-9 9H9a9 9 0 0 1-9-9V9a9 9 0 0 1 9-9Zm2 11a5 5 0 0 0 0 10h10a5 5 0 0 0 0-10Z"
					/>
				) : (
					<>
						<rect width="32" height="32" rx="9" fill={`url(#${id})`} />
						<rect
							x="6"
							y="11"
							width="20"
							height="10"
							rx="5"
							fill="#fff"
							fillOpacity=".85"
						/>
					</>
				)}
			</svg>
			LiquiKit
		</span>
	);
}
