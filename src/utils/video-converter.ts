import type { ConversionSettings, VideoMetadata } from "@/types";

/**
 * Format file size from bytes to human-readable format (KB/MB/GB)
 * @param bytes - File size in bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string with appropriate unit
 */
export function formatFileSize(bytes: number, decimals = 2): string {
	if (bytes === 0) return "0 Bytes";

	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ["Bytes", "KB", "MB", "GB"];

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Calculate aspect ratio from width and height
 * @param width - Video width in pixels
 * @param height - Video height in pixels
 * @returns Aspect ratio (width / height)
 */
export function calculateAspectRatio(width: number, height: number): number {
	if (height === 0) return 1;
	return width / height;
}

/**
 * Calculate height from width while maintaining aspect ratio
 * @param width - Desired width in pixels
 * @param aspectRatio - Original aspect ratio
 * @returns Calculated height in pixels (rounded)
 */
export function calculateHeightFromWidth(
	width: number,
	aspectRatio: number,
): number {
	if (aspectRatio === 0) return width;
	return Math.round(width / aspectRatio);
}

/**
 * Calculate width from height while maintaining aspect ratio
 * @param height - Desired height in pixels
 * @param aspectRatio - Original aspect ratio
 * @returns Calculated width in pixels (rounded)
 */
export function calculateWidthFromHeight(
	height: number,
	aspectRatio: number,
): number {
	return Math.round(height * aspectRatio);
}

/**
 * Estimate output GIF file size based on conversion settings
 * Formula: (width * height * frameRate * duration * quality) / 8000
 * This is an approximation and actual size may vary
 * @param videoMetadata - Original video metadata
 * @param settings - Conversion settings
 * @returns Estimated file size in bytes
 */
export function estimateGifSize(
	videoMetadata: VideoMetadata,
	settings: ConversionSettings,
): number {
	const { duration } = videoMetadata;
	const { width, height, frameRate, quality } = settings;

	// Base calculation
	const baseSize = (width * height * frameRate * duration * quality) / 8000;

	// Add overhead for GIF format (approximately 10-20%)
	const overhead = 1.15;

	return Math.round(baseSize * overhead);
}

/**
 * Generate output filename for GIF from original video filename
 * @param originalFileName - Original video file name
 * @returns GIF filename with .gif extension
 */
export function generateGifFilename(originalFileName: string): string {
	// Remove file extension
	const nameWithoutExt = originalFileName.replace(/\.[^/.]+$/, "");

	// Sanitize filename (remove special characters, keep alphanumeric, dash, underscore)
	const sanitized = nameWithoutExt.replace(/[^a-zA-Z0-9-_]/g, "_");

	return `${sanitized}.gif`;
}

/**
 * Format duration from seconds to MM:SS format
 * @param seconds - Duration in seconds
 * @returns Formatted duration string (MM:SS)
 */
export function formatDuration(seconds: number): string {
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = Math.floor(seconds % 60);

	return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
}

/**
 * Get default conversion settings based on video metadata
 * @param videoMetadata - Original video metadata
 * @returns Default conversion settings
 */
export function getDefaultSettings(
	videoMetadata: VideoMetadata,
): ConversionSettings {
	const defaultWidth = Math.min(videoMetadata.width, 800);
	const defaultHeight = calculateHeightFromWidth(
		defaultWidth,
		videoMetadata.aspectRatio,
	);

	return {
		quality: 80,
		frameRate: 15,
		width: defaultWidth,
		height: defaultHeight,
	};
}

/**
 * Validate conversion settings
 * @param settings - Conversion settings to validate
 * @returns Object with isValid flag and error message if invalid
 */
export function validateSettings(settings: ConversionSettings): {
	isValid: boolean;
	error?: string;
} {
	if (settings.quality < 1 || settings.quality > 100) {
		return { isValid: false, error: "Quality must be between 1 and 100" };
	}

	if (![10, 15, 20, 24, 30].includes(settings.frameRate)) {
		return {
			isValid: false,
			error: "Frame rate must be 10, 15, 20, 24, or 30 fps",
		};
	}

	if (settings.width < 100 || settings.width > 1920) {
		return {
			isValid: false,
			error: "Width must be between 100 and 1920 pixels",
		};
	}

	if (settings.height < 100 || settings.height > 1920) {
		return {
			isValid: false,
			error: "Height must be between 100 and 1920 pixels",
		};
	}

	return { isValid: true };
}
