import { Progress } from "@heroui/progress";
import type { FC } from "react";
import { memo } from "react";

interface ConversionProgressProps {
	progress: number; // 0-100
	status: "idle" | "loading" | "processing" | "complete" | "error";
	message?: string;
}

const getStatusMessage = (
	status: ConversionProgressProps["status"],
	progress: number,
): string => {
	switch (status) {
		case "idle":
			return "Ready to convert";
		case "loading":
			return "Initializing FFmpeg...";
		case "processing":
			return `Converting video to GIF... ${progress}%`;
		case "complete":
			return "Conversion complete!";
		case "error":
			return "Conversion failed";
		default:
			return "";
	}
};

const getStatusColor = (
	status: ConversionProgressProps["status"],
): "default" | "primary" | "success" | "warning" | "danger" => {
	switch (status) {
		case "loading":
			return "warning";
		case "processing":
			return "primary";
		case "complete":
			return "success";
		case "error":
			return "danger";
		default:
			return "default";
	}
};

const ConversionProgressComponent: FC<ConversionProgressProps> = ({
	progress,
	status,
	message,
}) => {
	// Don't render anything if idle
	if (status === "idle") {
		return null;
	}

	const displayMessage = message || getStatusMessage(status, progress);
	const color = getStatusColor(status);
	const isIndeterminate = status === "loading";

	return (
		<div className="w-full space-y-2 sm:space-y-3">
			<div className="flex items-center justify-between gap-2">
				<span className="font-medium text-foreground text-xs sm:text-sm">
					{displayMessage}
				</span>
				{status === "processing" && (
					<span className="whitespace-nowrap font-semibold text-primary text-xs sm:text-sm">
						{Math.round(progress)}%
					</span>
				)}
			</div>

			<Progress
				value={progress}
				color={color}
				isIndeterminate={isIndeterminate}
				className="w-full"
				aria-label="Conversion progress"
				size="md"
			/>

			{status === "error" && message && (
				<div className="rounded-lg border border-danger-200 bg-danger-50 p-3 sm:p-4 dark:border-danger-800 dark:bg-danger-950/20">
					<p className="text-danger-600 text-xs sm:text-sm dark:text-danger-400">
						{message}
					</p>
				</div>
			)}

			{status === "complete" && (
				<div className="rounded-lg border border-success-200 bg-success-50 p-3 sm:p-4 dark:border-success-800 dark:bg-success-950/20">
					<p className="text-success-600 text-xs sm:text-sm dark:text-success-400">
						✓ Your GIF is ready to download!
					</p>
				</div>
			)}
		</div>
	);
};

// Performance: Memoize component to prevent unnecessary re-renders
export const ConversionProgress = memo(ConversionProgressComponent);
