import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import type { FC } from "react";
import type { ErrorState } from "@/types";

interface ErrorMessageProps {
	error: ErrorState;
	onRetry?: () => void;
	onDismiss?: () => void;
	onReset?: () => void;
}

/**
 * Error message component with recovery actions
 * Requirement 1.4: Display error messages for unsupported formats
 * Requirement 6.5: Display error message with description of failure
 * Requirement 8.5: Display error message with troubleshooting guidance
 */
export const ErrorMessage: FC<ErrorMessageProps> = ({
	error,
	onRetry,
	onDismiss,
	onReset,
}) => {
	const getErrorIcon = () => {
		switch (error.type) {
			case "upload":
				return (
					<svg
						className="w-6 h-6"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/>
					</svg>
				);
			case "ffmpeg":
				return (
					<svg
						className="w-6 h-6"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				);
			case "conversion":
				return (
					<svg
						className="w-6 h-6"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				);
			default:
				return (
					<svg
						className="w-6 h-6"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/>
					</svg>
				);
		}
	};

	const getErrorTitle = () => {
		switch (error.type) {
			case "upload":
				return "Upload Error";
			case "ffmpeg":
				return "Initialization Error";
			case "conversion":
				return "Conversion Error";
			case "download":
				return "Download Error";
			default:
				return "Error";
		}
	};

	return (
		<Card className="border-2 border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-950/20">
			<CardBody className="gap-3 sm:gap-4 p-3 sm:p-4">
				<div className="flex items-start gap-2 sm:gap-3">
					<div className="flex-shrink-0 text-danger-600 dark:text-danger-400 min-w-[24px]">
						{getErrorIcon()}
					</div>
					<div className="flex-1 space-y-1 sm:space-y-2">
						<h3 className="text-base sm:text-lg font-semibold text-danger-700 dark:text-danger-300">
							{getErrorTitle()}
						</h3>
						<p className="text-xs sm:text-sm text-danger-600 dark:text-danger-400">
							{error.message}
						</p>
					</div>
				</div>

				{/* Recovery Actions */}
				{error.recoverable && (
					<div className="flex flex-wrap gap-2">
						{error.retryAction && onRetry && (
							<Button
								size="sm"
								color="danger"
								variant="flat"
								onPress={onRetry}
								aria-label="Retry the failed operation"
								className="min-h-[44px] sm:min-h-[36px]"
							>
								Try Again
							</Button>
						)}
						{onReset && (
							<Button
								size="sm"
								variant="bordered"
								onPress={onReset}
								aria-label="Start over with a new file"
								className="min-h-[44px] sm:min-h-[36px]"
							>
								Start Over
							</Button>
						)}
						{onDismiss && (
							<Button
								size="sm"
								variant="light"
								onPress={onDismiss}
								aria-label="Dismiss error message"
								className="min-h-[44px] sm:min-h-[36px]"
							>
								Dismiss
							</Button>
						)}
					</div>
				)}
			</CardBody>
		</Card>
	);
};
