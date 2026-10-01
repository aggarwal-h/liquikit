import { Progress } from "@liquikit/react";
import { useEffect, useState } from "react";

export default function ProgressDemo() {
	const [progress, setProgress] = useState(20);
	useEffect(() => {
		const timer = setInterval(
			() => setProgress((value) => (value >= 100 ? 0 : value + 10)),
			900,
		);
		return () => clearInterval(timer);
	}, []);
	return (
		<div className="flex w-full max-w-[320px] flex-col gap-6">
			<Progress label="Downloading" value={progress} />
			<Progress aria-label="Loading" value={null} />
		</div>
	);
}
