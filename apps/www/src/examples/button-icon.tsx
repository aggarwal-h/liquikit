import { Button } from "@liquikit/react";
import { Heart, Plus, Share } from "lucide-react";

export default function ButtonIcon() {
	return (
		<div className="flex items-center gap-3">
			<Button icon aria-label="Share">
				<Share className="size-[18px]" />
			</Button>
			<Button icon variant="prominent" aria-label="Add">
				<Plus className="size-[18px]" />
			</Button>
			<Button icon variant="clear" aria-label="Favourite">
				<Heart className="size-[18px]" />
			</Button>
		</div>
	);
}
