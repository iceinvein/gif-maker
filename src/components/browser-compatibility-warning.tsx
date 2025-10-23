import { Card, CardBody } from "@heroui/card";
import type { FC } from "react";

interface BrowserCompatibilityWarningProps {
	missingFeatures: string[];
}

/**
 * Browser compatibility warning component
 * Requirement 8.5: Display browser compatibility warnings for unsupported features
 */
export const BrowserCompatibilityWarning: FC<
	BrowserCompatibilityWarningProps
> = ({ missingFeatures }) => {
	return (
		<Card className="border-2 border-warning-200 bg-warning-50 dark:border-warning-800 dark:bg-warning-950/20">
			<CardBody className="gap-3 p-3 sm:gap-4 sm:p-4">
				<div className="flex items-start gap-2 sm:gap-3">
					<div className="min-w-6 shrink-0 text-warning-600 dark:text-warning-400">
						<svg
							className="h-5 w-5 sm:h-6 sm:w-6"
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
					</div>
					<div className="flex-1 space-y-1 sm:space-y-2">
						<h3 className="font-semibold text-base text-warning-700 sm:text-lg dark:text-warning-300">
							Browser Compatibility Issue
						</h3>
						<p className="text-warning-600 text-xs sm:text-sm dark:text-warning-400">
							Your browser does not support some features required for video
							conversion:
						</p>
						<ul className="list-inside list-disc space-y-1 text-warning-600 text-xs sm:text-sm dark:text-warning-400">
							{missingFeatures.map((feature) => (
								<li key={feature}>{feature}</li>
							))}
						</ul>
						<p className="mt-2 text-warning-600 text-xs sm:mt-3 sm:text-sm dark:text-warning-400">
							Please use one of the following browsers for the best experience:
						</p>
						<ul className="list-inside list-disc space-y-1 text-warning-600 text-xs sm:text-sm dark:text-warning-400">
							<li>Chrome/Edge (version 90 or later)</li>
							<li>Firefox (version 88 or later)</li>
							<li>Safari (version 15 or later)</li>
						</ul>
					</div>
				</div>
			</CardBody>
		</Card>
	);
};
