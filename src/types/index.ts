import type { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
	size?: number;
};

// Video to GIF Converter Types

export interface VideoMetadata {
	duration: number; // in seconds
	width: number; // in pixels
	height: number; // in pixels
	frameRate: number; // frames per second
	aspectRatio: number; // width / height
}

export interface ConversionSettings {
	quality: number; // 1-100, default: 80
	frameRate: number; // 10, 15, 20, 24, 30, default: 15
	width: number; // 100-1920, default: min(videoWidth, 800)
	height: number; // calculated to maintain aspect ratio
}

export interface ConversionProgress {
	progress: number; // 0-100
	stage: "initializing" | "loading" | "processing" | "finalizing";
	message: string;
}

export interface ErrorState {
	type: "upload" | "ffmpeg" | "conversion" | "download";
	message: string;
	recoverable: boolean;
	retryAction?: () => void;
}
