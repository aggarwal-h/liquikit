import { CopyButton } from "./copy-button";

export function Command({ command }: { command: string }) {
	return (
		<div className="code group relative flex items-center rounded-[14px] bg-[#0d1117] ring-1 ring-white/10">
			<pre className="min-w-0 flex-1 overflow-x-auto py-3.5 pr-3 pl-5 font-mono text-[13px] leading-[1.6] text-white/90">
				<span className="select-none text-white/35">$ </span>
				{command}
			</pre>
			<CopyButton value={() => command} className="mr-2.5 shrink-0" />
		</div>
	);
}
