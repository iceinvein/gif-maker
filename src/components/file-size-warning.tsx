import { Card, CardBody } from "@heroui/card";
import type { FC } from "react";

interface FileSizeWarningProps {
	fileSize: number; // in bytes
	fileName: string;
}

const WARNING_THRESHOLD = 200 * 1024 * 1024; // 200MB

/**
 * File size warning component for large files
 * Requirement 8.5: Show file size warnings for large files (>200MB)
 */
export const FileSizeWarning: FC<FileSizeWarningProps> = ({
	fileSize,
	fileName,
}) => {
	// Only show warning if file is larger than threshold
	if (fileSize <= WARNING_THRESHOLD) {
		return null;
	}

	const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);

	return (
		<Card className="border-2 border-warning-200 bg-warning-50 dark:border-warning-800 dark:bg-warning-950/20">
			<CardBody className="gap-2 p-3 sm:gap-3 sm:p-4">
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
								d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					</div>
					<div className="flex-1 space-y-1 sm:space-y-2">
						<h3 className="font-semibold text-base text-warning-700 sm:text-lg dark:text-warning-300">
							Large File Warning
						</h3>
						<p className="text-warning-600 text-xs sm:text-sm dark:text-warning-400">
							The file <strong className="break-all">{fileName}</strong> is{" "}
							{fileSizeMB}MB, which may take longer to process and could cause
							performance issues.
						</p>
						<div className="space-y-1 text-warning-600 text-xs sm:text-sm dark:text-warning-400">
							<p className="font-semibold">Recommendations:</p>
							<ul className="ml-2 list-inside list-disc space-y-1">
								<li>Consider using a shorter video clip</li>
								<li>Reduce the output dimensions (width/height)</li>
								<li>Lower the quality setting</li>
								<li>Decrease the frame rate</li>
							</ul>
						</div>
					</div>
				</div>
			</CardBody>
		</Card>
	);
};
