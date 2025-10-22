import { Card, CardBody } from "@heroui/card";
import { type FC, memo, useEffect, useRef, useState } from "react";
import type { VideoMetadata } from "@/types";

interface VideoPreviewProps {
	file: File;
	onMetadataLoad: (metadata: VideoMetadata) => void;
}

const formatDuration = (seconds: number): string => {
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const formatFileSize = (bytes: number): string => {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const VideoPreviewComponent: FC<VideoPreviewProps> = ({
	file,
	onMetadataLoad,
}) => {
	const [videoUrl, setVideoUrl] = useState<string | null>(null);
	const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
	const videoRef = useRef<HTMLVideoElement>(null);

	useEffect(() => {
		// Create object URL for video preview
		const url = URL.createObjectURL(file);
		setVideoUrl(url);

		// Cleanup function to revoke object URL on unmount or file change
		// Performance: Proper memory cleanup for object URLs
		return () => {
			URL.revokeObjectURL(url);
			setVideoUrl(null);
			setMetadata(null);
		};
	}, [file]);

	const handleLoadedMetadata = () => {
		const video = videoRef.current;
		if (!video) return;

		// Extract video metadata
		const width = video.videoWidth;
		const height = video.videoHeight;
		const duration = video.duration;
		const aspectRatio = width / height;

		// Attempt to get frame rate (not always available in browsers)
		// Default to 30 if not available or invalid
		let frameRate = 30;

		// Some browsers expose frame rate through getVideoPlaybackQuality
		if ("getVideoPlaybackQuality" in video) {
			const quality = video.getVideoPlaybackQuality();
			if (quality && "totalVideoFrames" in quality && duration > 0) {
				const calculatedFps = Math.round(
					(quality.totalVideoFrames as number) / duration,
				);
				// Only use calculated FPS if it's a reasonable value (between 1 and 120)
				if (calculatedFps > 0 && calculatedFps <= 120) {
					frameRate = calculatedFps;
				}
			}
		}

		const videoMetadata: VideoMetadata = {
			duration,
			width,
			height,
			frameRate,
			aspectRatio,
		};

		setMetadata(videoMetadata);
		onMetadataLoad(videoMetadata);
	};

	return (
		<Card className="w-full h-full flex flex-col">
			<CardBody className="p-3 sm:p-4 space-y-3 sm:space-y-4 flex flex-col h-full">
				<div className="relative w-full rounded-lg overflow-hidden bg-black dark:bg-black flex-1 flex items-center justify-center">
					{videoUrl && (
						<video
							ref={videoRef}
							src={videoUrl}
							controls
							className="w-full h-full object-contain"
							style={{ maxHeight: "calc(100vh - 280px)" }}
							onLoadedMetadata={handleLoadedMetadata}
							aria-label="Video preview"
						>
							Your browser does not support the video tag.
						</video>
					)}
				</div>

				{metadata && (
					<div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm p-2 rounded-lg bg-default-100 dark:bg-default-50/5">
						<div className="space-y-1">
							<p className="text-default-500 dark:text-default-400">Duration</p>
							<p className="font-semibold text-foreground">
								{formatDuration(metadata.duration)}
							</p>
						</div>
						<div className="space-y-1">
							<p className="text-default-500 dark:text-default-400">
								Dimensions
							</p>
							<p className="font-semibold text-foreground break-all">
								{metadata.width} × {metadata.height}px
							</p>
						</div>
						<div className="space-y-1">
							<p className="text-default-500 dark:text-default-400">
								Frame Rate
							</p>
							<p className="font-semibold text-foreground">
								{metadata.frameRate} fps
							</p>
						</div>
						<div className="space-y-1">
							<p className="text-default-500 dark:text-default-400">
								File Size
							</p>
							<p className="font-semibold text-foreground">
								{formatFileSize(file.size)}
							</p>
						</div>
					</div>
				)}
			</CardBody>
		</Card>
	);
};

// Performance: Memoize component to prevent unnecessary re-renders
export const VideoPreview = memo(VideoPreviewComponent);
