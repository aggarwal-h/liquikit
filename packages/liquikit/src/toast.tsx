"use client";

import { Toast as BaseToast } from "@base-ui/react/toast";
import {
	type ComponentProps,
	type CSSProperties,
	useMemo,
	useRef,
} from "react";
import type { GlassRefraction, GlassTheme } from "./glass";
import { MorphPane, PopupState } from "./popup";
import "./liquikit.css";

const TOAST_RADIUS = 26;
const TOAST_GAP = 8;

type ToastObject = BaseToast.Root.ToastObject;

function ToastGlass({
	open,
	...props
}: ComponentProps<typeof MorphPane> & { open: boolean }) {
	const trigger = useRef<HTMLElement | null>(null);
	const state = useMemo(() => ({ open, trigger }), [open]);
	return (
		<PopupState.Provider value={state}>
			<MorphPane {...props} origin="top" panelRadius={TOAST_RADIUS} />
		</PopupState.Provider>
	);
}

function GlassToast({
	toast,
	offset,
	theme,
	refraction,
}: {
	toast: ToastObject;
	offset: number;
	theme?: GlassTheme;
	refraction?: GlassRefraction;
}) {
	return (
		<BaseToast.Root
			toast={toast}
			swipeDirection="up"
			className="glass-ui-popup glass-ui-toast"
			style={{ "--glass-toast-y": `${offset}px` } as CSSProperties}
			render={(props, state) => (
				<ToastGlass
					{...props}
					open={state.transitionStatus !== "ending"}
					theme={theme}
					refraction={refraction}
				/>
			)}
		>
			<BaseToast.Content className="glass-ui-toast__content">
				<BaseToast.Title className="glass-ui-toast__title" />
				<BaseToast.Description className="glass-ui-toast__description" />
			</BaseToast.Content>
			<BaseToast.Close className="glass-ui-toast__close" aria-label="Dismiss">
				<svg viewBox="0 0 16 16" aria-hidden="true">
					<path d="m5 5 6 6m0-6-6 6" />
				</svg>
			</BaseToast.Close>
		</BaseToast.Root>
	);
}

export type ToastViewportProps = {
	theme?: GlassTheme;
	refraction?: GlassRefraction;
	container?: BaseToast.Portal.Props["container"];
};

function Viewport({ theme, refraction, container }: ToastViewportProps) {
	const { toasts } = BaseToast.useToastManager();
	let below = 0;
	const offsets = toasts.map((toast) => {
		const offset = below;
		if (toast.transitionStatus !== "ending" && !toast.limited) {
			below += (toast.height ?? 0) + TOAST_GAP;
		}
		return offset;
	});
	return (
		<BaseToast.Portal container={container}>
			<BaseToast.Viewport className="glass-ui-toast__viewport">
				{toasts.map((toast, index) => (
					<GlassToast
						key={toast.id}
						toast={toast}
						offset={offsets[index]}
						theme={theme}
						refraction={refraction}
					/>
				))}
			</BaseToast.Viewport>
		</BaseToast.Portal>
	);
}

export const Toast = {
	Provider: BaseToast.Provider,
	Viewport,
};

export const useToast = BaseToast.useToastManager;

export const ToastProvider = Toast.Provider;
export const ToastViewport = Toast.Viewport;
