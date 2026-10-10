"use client";

import { OTPField as BaseOTPField } from "@base-ui/react/otp-field";
import { Fragment } from "react";
import { GlassPane, type GlassRefraction } from "./glass";
import { cx, type GlassOptions } from "./types";
import "./liquikit.css";

export type OtpFieldProps = Omit<
	BaseOTPField.Root.Props,
	"className" | "render" | "children" | "length"
> &
	GlassOptions & {
		length?: number;
		groupSize?: number;
		refraction?: GlassRefraction;
		className?: string;
	};

export function OtpField({
	length = 6,
	groupSize,
	theme,
	lens,
	liquid,
	refraction,
	className,
	...rootProps
}: OtpFieldProps) {
	// Base UI drops an aria-label from the first slot, which leaves it unnamed
	// when the field has no <label>, so the first slot takes the field's own.
	const firstLabel = rootProps["aria-label"];

	return (
		<BaseOTPField.Root
			{...rootProps}
			length={length}
			className={cx("glass-ui-otp", className)}
		>
			{Array.from({ length }, (_, index) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: a slot is its position
				<Fragment key={index}>
					{groupSize && index > 0 && index % groupSize === 0 ? (
						<BaseOTPField.Separator className="glass-ui-otp__separator" />
					) : null}
					<BaseOTPField.Input
						aria-label={
							index === 0 ? undefined : `Character ${index + 1} of ${length}`
						}
						render={(props) => (
							<span className="glass-ui-otp__slot">
								<GlassPane
									radius={12}
									theme={theme}
									lens={lens}
									liquid={liquid}
									refraction={refraction}
								>
									<input
										{...props}
										aria-label={props["aria-label"] ?? firstLabel}
										className="glass-ui-otp__input"
									/>
								</GlassPane>
							</span>
						)}
					/>
				</Fragment>
			))}
		</BaseOTPField.Root>
	);
}
