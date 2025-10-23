import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

export interface ConversionSettings {
	quality: number; // 1-100
	frameRate: number; // 10, 15, 20, 24, 30
	width: number; // 100-1920
	height: number; // calculated from aspect ratio
	startTime: number; // trim start time in seconds
	endTime: number; // trim end time in seconds
}

export interface FFmpegServiceInterface {
	initialize(): Promise<void>;
	isLoaded(): boolean;
	convertToGif(
		videoFile: File,
		settings: ConversionSettings,
		onProgress: (progress: number) => void,
	): Promise<Blob>;
	terminate(): void;
}

class FFmpegServiceImpl implements FFmpegServiceInterface {
	private ffmpeg: FFmpeg | null = null;
	private loaded = false;
	private initPromise: Promise<void> | null = null;

	/**
	 * Initialize FFmpeg.wasm by loading core and worker files
	 * Requirement 8.1: Perform all video processing using WASM Processing in the browser
	 * Requirement 8.3: Load all required WASM modules within 5 seconds
	 * Requirement 8.5: Display error message with troubleshooting guidance
	 * Performance: Lazy loading - only loads when first needed
	 */
	async initialize(): Promise<void> {
		if (this.loaded) {
			return;
		}

		// Return existing initialization promise if already in progress
		if (this.initPromise) {
			return this.initPromise;
		}

		// Create initialization promise
		this.initPromise = (async () => {
			try {
				this.ffmpeg = new FFmpeg();

				// Set up progress logging
				this.ffmpeg.on("log", ({ message }) => {
					console.log("[FFmpeg]", message);
				});

				// Load FFmpeg core and worker files from CDN with timeout
				const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";

				// Create timeout promise
				const LOAD_TIMEOUT = 10000; // 10 seconds
				const timeoutPromise = new Promise<never>((_, reject) => {
					setTimeout(() => {
						reject(new Error("FFmpeg initialization timed out"));
					}, LOAD_TIMEOUT);
				});

				// Load FFmpeg with timeout
				const loadPromise = this.ffmpeg.load({
					coreURL: await toBlobURL(
						`${baseURL}/ffmpeg-core.js`,
						"text/javascript",
					),
					wasmURL: await toBlobURL(
						`${baseURL}/ffmpeg-core.wasm`,
						"application/wasm",
					),
				});

				await Promise.race([loadPromise, timeoutPromise]);

				this.loaded = true;
			} catch (error) {
				this.loaded = false;
				this.initPromise = null;
				// Requirement 8.5: Display error message with troubleshooting guidance
				let errorMessage = "Failed to initialize FFmpeg. ";

				if (error instanceof Error) {
					if (
						error.message.includes("timeout") ||
						error.message.includes("timed out")
					) {
						errorMessage +=
							"The video processing library took too long to load. Please check your internet connection and try again.";
					} else if (
						error.message.includes("network") ||
						error.message.includes("fetch")
					) {
						errorMessage +=
							"Could not download the video processing library. Please check your internet connection and try again.";
					} else if (
						error.message.includes("WASM") ||
						error.message.includes("WebAssembly")
					) {
						errorMessage +=
							"Your browser does not support WebAssembly, which is required for video processing. Please use a modern browser.";
					} else {
						errorMessage += error.message;
					}
				} else {
					errorMessage +=
						"An unknown error occurred. Please refresh the page and try again.";
				}

				throw new Error(errorMessage);
			}
		})();

		return this.initPromise;
	}

	/**
	 * Check if FFmpeg is loaded and ready
	 */
	isLoaded(): boolean {
		return this.loaded && this.ffmpeg !== null;
	}

	/**
	 * Convert video file to GIF with specified settings
	 * Requirement 8.1: Perform all video processing using WASM Processing in the browser
	 * Requirement 8.2: Do NOT transmit any Video File data to external servers
	 * Requirement 6.2: Update progress bar at intervals not exceeding 1 second
	 * Performance: Throttled progress updates (100ms intervals)
	 */
	async convertToGif(
		videoFile: File,
		settings: ConversionSettings,
		onProgress: (progress: number) => void,
	): Promise<Blob> {
		if (!this.ffmpeg || !this.loaded) {
			throw new Error(
				"FFmpeg is not initialized. Please call initialize() first.",
			);
		}

		try {
			const inputFileName = "input.mp4";
			const outputFileName = "output.gif";

			// Write video file to FFmpeg virtual filesystem
			const fileData = await fetchFile(videoFile);
			await this.ffmpeg.writeFile(inputFileName, fileData);

			// Set up progress tracking with throttling
			let videoDuration = 0;
			let lastProgressUpdate = 0;
			const PROGRESS_THROTTLE = 100; // 100ms throttle

			this.ffmpeg.on("log", ({ message }) => {
				// Extract duration from FFmpeg output
				const durationMatch = message.match(
					/Duration: (\d{2}):(\d{2}):(\d{2})/,
				);
				if (durationMatch) {
					const hours = Number.parseInt(durationMatch[1], 10);
					const minutes = Number.parseInt(durationMatch[2], 10);
					const seconds = Number.parseInt(durationMatch[3], 10);
					videoDuration = hours * 3600 + minutes * 60 + seconds;
				}

				// Extract current time from FFmpeg output with throttling
				const timeMatch = message.match(/time=(\d{2}):(\d{2}):(\d{2})/);
				if (timeMatch && videoDuration > 0) {
					const now = Date.now();
					if (now - lastProgressUpdate >= PROGRESS_THROTTLE) {
						const hours = Number.parseInt(timeMatch[1], 10);
						const minutes = Number.parseInt(timeMatch[2], 10);
						const seconds = Number.parseInt(timeMatch[3], 10);
						const currentTime = hours * 3600 + minutes * 60 + seconds;
						const progress = Math.min((currentTime / videoDuration) * 100, 100);
						onProgress(progress);
						lastProgressUpdate = now;
					}
				}
			});

			// Build and execute FFmpeg command
			const command = this.buildFFmpegCommand(
				inputFileName,
				outputFileName,
				settings,
			);

			await this.ffmpeg.exec(command);

			// Read output file from virtual filesystem
			const data = await this.ffmpeg.readFile(outputFileName);

			// Clean up virtual filesystem (memory management)
			await this.ffmpeg.deleteFile(inputFileName);
			await this.ffmpeg.deleteFile(outputFileName);

			// Convert to Blob (create a new Uint8Array to ensure proper typing)
			const uint8Array = new Uint8Array(data as Uint8Array);
			const blob = new Blob([uint8Array], { type: "image/gif" });

			// Requirement 6.4: Display completion message (progress = 100)
			onProgress(100);

			return blob;
		} catch (error) {
			// Requirement 6.5: Display error message with description of failure
			throw new Error(
				`Video conversion failed: ${error instanceof Error ? error.message : "Unknown error"}. Please try a different video file or adjust the settings.`,
			);
		}
	}

	/**
	 * Build FFmpeg command with quality, frame rate, dimension, and trim parameters
	 * Uses two-pass palette generation for optimal GIF quality
	 * Supports video trimming with -ss (start time) and -t (duration)
	 */
	private buildFFmpegCommand(
		inputFile: string,
		outputFile: string,
		settings: ConversionSettings,
	): string[] {
		const { quality, frameRate, width, height, startTime, endTime } = settings;

		// Calculate max colors based on quality (1-100 -> 16-256 colors)
		const maxColors = Math.floor(16 + (quality / 100) * 240);

		// Build filter chain for optimal GIF conversion
		// 1. Set frame rate
		// 2. Scale to target dimensions with Lanczos algorithm
		// 3. Split stream for palette generation
		// 4. Generate palette with quality-based color count
		// 5. Apply palette with Bayer dithering
		const filterComplex = [
			`fps=${frameRate}`,
			`scale=${width}:${height}:flags=lanczos`,
			"split[s0][s1]",
			`[s0]palettegen=max_colors=${maxColors}[p]`,
			"[s1][p]paletteuse=dither=bayer:bayer_scale=5",
		].join(",");

		// Calculate trim duration
		const trimDuration = endTime - startTime;

		// Build command with trim parameters
		// -ss: seek to start time (before -i for faster seeking)
		// -t: duration to process
		const command = [
			"-ss",
			startTime.toFixed(3), // Start time in seconds with millisecond precision
			"-i",
			inputFile,
			"-t",
			trimDuration.toFixed(3), // Duration in seconds with millisecond precision
			"-vf",
			filterComplex,
			"-loop",
			"0", // Infinite loop
			outputFile,
		];

		return command;
	}

	/**
	 * Terminate FFmpeg instance and clean up resources
	 */
	terminate(): void {
		if (this.ffmpeg) {
			// Remove event listeners
			this.ffmpeg.off("log", () => {});
			this.ffmpeg = null;
			this.loaded = false;
		}
	}
}

// Export singleton instance
const ffmpegService = new FFmpegServiceImpl();
export default ffmpegService;
