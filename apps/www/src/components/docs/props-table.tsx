import { props as allProps } from "virtual:liquikit-docs";
import { ArrowUpRight } from "lucide-react";
import { Rich } from "./inline";
import { describe } from "./prop-docs";

const HIDDEN = new Set(["className", "style"]);

const READABLE: Array<[RegExp, string]> = [
	[/\bGlassTheme\b/g, '"light" | "dark"'],
	[/\bGlassRefraction\b/g, '"interactive" | "always"'],
	[/\bGlassPaneVariant\b/g, '"regular" | "clear"'],
	[/\(\s+/g, "("],
	[/,\s*\)/g, ")"],
];

function readable(type: string) {
	return READABLE.reduce(
		(text, [pattern, value]) => text.replace(pattern, value),
		type,
	);
}

export function Props({ name, only }: { name: string; only?: string[] }) {
	const parts = (allProps[name] ?? []).filter(
		(part) => !only || only.includes(part.name),
	);
	return (
		<div className="flex flex-col gap-10">
			{parts.map((part) => {
				const rows = part.props.filter((prop) => !HIDDEN.has(prop.name));
				return (
					<section key={part.name}>
						<h3
							id={`api-${part.name.toLowerCase().replace(/\./g, "-")}`}
							className="scroll-mt-24 font-mono text-[15px] font-medium text-white"
						>
							{part.name}
						</h3>
						{rows.length > 0 ? (
							<div className="mt-3 overflow-x-auto rounded-[14px] ring-1 ring-white/10">
								<table className="w-full min-w-[560px] text-left text-[13.5px]">
									<thead className="bg-white/[0.03] text-white/50">
										<tr>
											<th className="w-[26%] px-4 py-2.5 font-medium">Prop</th>
											<th className="px-4 py-2.5 font-medium">Type</th>
											<th className="w-[16%] px-4 py-2.5 font-medium">
												Default
											</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-white/[0.07]">
										{rows.map((prop) => {
											const info = describe(part.name, prop.name);
											const constant = /^[A-Z_]+$/.test(prop.default ?? "");
											const initial = constant
												? info.default
												: (prop.default ?? info.default);
											return (
												<tr key={prop.name} className="align-top">
													<td className="px-4 py-3">
														<code className="font-mono text-[13px] text-[#9cc0ff]">
															{prop.name}
															{prop.optional ? "" : "*"}
														</code>
													</td>
													<td className="px-4 py-3">
														<code className="font-mono text-[12.5px] break-words text-white/75">
															{readable(prop.type)}
														</code>
														{info.text ? (
															<p className="mt-1.5 text-[13.5px] leading-[1.5] text-white/55">
																<Rich text={info.text} />
															</p>
														) : null}
													</td>
													<td className="px-4 py-3 font-mono text-[12.5px] text-white/60">
														{initial ?? "—"}
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						) : null}
						{part.base ? (
							<p className="mt-3 text-[13.5px] text-white/50">
								{rows.length > 0 ? "Also takes" : "Takes"} every prop of{" "}
								<a
									href={`https://base-ui.com/react/components/${part.base}`}
									className="inline-flex items-center gap-0.5 text-white/80 underline decoration-white/25 underline-offset-2 hover:decoration-white/70"
								>
									Base UI&apos;s {part.base.replace(/-/g, " ")}
									<ArrowUpRight className="size-3.5" />
								</a>
								, plus{" "}
								<code className="font-mono text-[12.5px]">className</code> and{" "}
								<code className="font-mono text-[12.5px]">style</code>.
							</p>
						) : null}
					</section>
				);
			})}
		</div>
	);
}
