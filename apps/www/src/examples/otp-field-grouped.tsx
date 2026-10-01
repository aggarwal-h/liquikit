import { OtpField } from "@liquikit/react";

export default function OtpFieldGrouped() {
	return <OtpField length={6} groupSize={3} aria-label="Verification code" />;
}
