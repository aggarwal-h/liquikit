import { Button, useToast } from "@liquikit/react";
import { useState } from "react";

const TOASTS = [
	{ title: "Copied", description: "The link is on your clipboard." },
	{ title: "Saved to Photos", description: "Blue hour.png" },
	{ title: "Sent", description: "Your message is on its way." },
];

export default function ToastDemo() {
	const toast = useToast();
	const [count, setCount] = useState(0);
	return (
		<Button
			variant="prominent"
			onClick={() => {
				toast.add(TOASTS[count % TOASTS.length]);
				setCount(count + 1);
			}}
		>
			Show a toast
		</Button>
	);
}
