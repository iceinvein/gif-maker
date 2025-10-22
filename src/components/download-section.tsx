import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import type { FC } from "react";
import { memo, useEffect, useMemo, useState } from "react";

interface DownloadSectionProps {
	gifBlob: Blob | null;
	originalFileName: string;
	fileSize: number;
	onReset: () => void;
}

/**
 * Format bytes to human-readable file size
 */
const formatFileSize = (bytes: number): string => {
	if (bytes === 0) return "0 Bytes";

	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
};

/**
 * Generate GIF filename from original video name
 */
const generateGifFilename = (originalFileName: string): string => {
	// Remove file extension and add .gif
	return `${originalFileName.replace(/\.[^/.]+$/, "")}.gif`;
};

const DownloadSectionComponent: FC<DownloadSectionProps> = ({
	gifBlob,
	originalFileName,
	fileSize,
	onReset,
}) => {
	const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

	// Generate download URL from blob
	// Performance: Proper memory cleanup for Blob URLs
	useEffect(() => {
		if (gifBlob) {
			const url = URL.createObjectURL(gifBlob);
			setDownloadUrl(url);

			// Cleanup function to revoke the URL when component unmounts or blob changes
			return () => {
				URL.revokeObjectURL(url);
				setDownloadUrl(null);
			};
		}
	}, [gifBlob]);

	// Generate filename
	const gifFilename = useMemo(
		() => generateGifFilename(originalFileName),
		[originalFileName],
	);

	// Format file size
	const formattedSize = useMemo(() => formatFileSize(fileSize), [fileSize]);

	// Don't render if no GIF blob
	if (!gifBlob || !downloadUrl) {
		return null;
	}

	return (
		<Card className="w-full">
			<CardBody className="gap-3 sm:gap-4 p-3 sm:p-4">
				<div className="flex flex-col gap-1 sm:gap-2">
					<h3 className="text-base sm:text-lg font-semibold text-foreground">
						Download Your GIF
					</h3>
					<div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm text-default-600">
						<span className="font-medium break-all">{gifFilename}</span>
						<span className="hidden sm:inline">•</span>
						<span>{formattedSize}</span>
					</div>
				</div>

				<div className="flex flex-col sm:flex-row gap-3">
					<Button
						as="a"
						href={downloadUrl}
						download={gifFilename}
						color="primary"
						size="lg"
						className="flex-1 min-h-[44px]"
					>
						Download GIF
					</Button>

					<Button
						onPress={onReset}
						variant="bordered"
						size="lg"
						className="flex-1 min-h-[44px]"
					>
						Convert Another
					</Button>
				</div>
			</CardBody>
		</Card>
	);
};

// Performance: Memoize component to prevent unnecessary re-renders
export const DownloadSection = memo(DownloadSectionComponent);
