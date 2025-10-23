import { Card, CardBody } from "@heroui/card";
import {
	forwardRef,
	memo,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from "react";
import type { VideoMetadata } from "@/types";

interface VideoPreviewProps {
	file: File;
	onMetadataLoad: (metadata: VideoMetadata) => void;
	onTimeUpdate?: (currentTime: number) => void;
	seekTime?: number;
}

export interface VideoPreviewRef {
	seek: (time: number) => void;
	getCurrentTime: () => number;
	getVideoElement: () => HTMLVideoElement | null;
	play: () => Promise<void>;
	pause: () => void;
	togglePlayPause: () => Promise<void>;
}

const VideoPreviewComponent = forwardRef<VideoPreviewRef, VideoPreviewProps>(
	({ file, onMetadataLoad, onTimeUpdate, seekTime }, ref) => {
		const [videoUrl, setVideoUrl] = useState<string | null>(null);
		const videoRef = useRef<HTMLVideoElement>(null);

		// Expose methods to parent via ref
		useImperativeHandle(ref, () => ({
			seek: (time: number) => {
				if (videoRef.current && Number.isFinite(time)) {
					videoRef.current.currentTime = time;
				}
			},
			getCurrentTime: () => {
				return videoRef.current?.currentTime ?? 0;
			},
			getVideoElement: () => {
				return videoRef.current;
			},
			play: async () => {
				if (videoRef.current) {
					await videoRef.current.play();
				}
			},
			pause: () => {
				if (videoRef.current) {
					videoRef.current.pause();
				}
			},
			togglePlayPause: async () => {
				if (videoRef.current) {
					if (videoRef.current.paused) {
						await videoRef.current.play();
					} else {
						videoRef.current.pause();
					}
				}
			},
		}));

		useEffect(() => {
			// Create object URL for video preview
			const url = URL.createObjectURL(file);
			setVideoUrl(url);

			// Cleanup function to revoke object URL on unmount or file change
			// Performance: Proper memory cleanup for object URLs
			return () => {
				URL.revokeObjectURL(url);
				setVideoUrl(null);
			};
		}, [file]);

		// Handle seek time changes from parent
		useEffect(() => {
			if (seekTime !== undefined && videoRef.current) {
				videoRef.current.currentTime = seekTime;
			}
		}, [seekTime]);

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

			onMetadataLoad(videoMetadata);
		};

		const handleTimeUpdate = () => {
			if (onTimeUpdate && videoRef.current) {
				onTimeUpdate(videoRef.current.currentTime);
			}
		};

		return (
			<Card className="flex h-full w-full flex-col">
				<CardBody className="flex h-full flex-col space-y-3 p-3 sm:space-y-4 sm:p-4">
					<div className="relative flex w-full flex-1 items-center justify-center overflow-hidden rounded-lg bg-black dark:bg-black">
						{videoUrl && (
							<video
								ref={videoRef}
								src={videoUrl}
								controls
								className="h-full w-full object-contain"
								style={{ maxHeight: "calc(50dvh)" }}
								onLoadedMetadata={handleLoadedMetadata}
								onTimeUpdate={handleTimeUpdate}
								aria-label="Video preview"
							>
								Your browser does not support the video tag.
							</video>
						)}
					</div>
				</CardBody>
			</Card>
		);
	},
);

VideoPreviewComponent.displayName = "VideoPreview";

// Performance: Memoize component to prevent unnecessary re-renders
export const VideoPreview = memo(VideoPreviewComponent);
