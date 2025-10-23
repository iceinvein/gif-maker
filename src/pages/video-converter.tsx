import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { BrowserCompatibilityWarning } from "@/components/browser-compatibility-warning";
import { ConversionControls } from "@/components/conversion-controls";
import { ConversionProgress } from "@/components/conversion-progress";
import { ErrorMessage } from "@/components/error-message";
import { FileSizeWarning } from "@/components/file-size-warning";
import { FileUploadZone } from "@/components/file-upload-zone";
import { KeyboardShortcutsOverlay } from "@/components/keyboard-shortcuts-overlay";
import { VideoPreview, type VideoPreviewRef } from "@/components/video-preview";
import { VideoTimeline } from "@/components/video-timeline";
import DefaultLayout from "@/layouts/default";
import ffmpegService from "@/services/ffmpeg-service";
import type { ConversionSettings, ErrorState, VideoMetadata } from "@/types";
import { checkBrowserCompatibility } from "@/utils/browser-compatibility";

// Supported video formats for file upload
const ACCEPTED_FORMATS = [
	"video/mp4",
	"video/webm",
	"video/quicktime",
	"video/x-msvideo",
];

// State interface for the converter
interface ConverterState {
	uploadedFile: File | null;
	videoMetadata: VideoMetadata | null;
	settings: ConversionSettings;
	conversionStatus: "idle" | "loading" | "processing" | "complete" | "error";
	progress: number;
	gifBlob: Blob | null;
	error: ErrorState | null;
	ffmpegLoaded: boolean;
}

// Action types for state management
type ConverterAction =
	| { type: "SET_FILE"; payload: File }
	| { type: "SET_METADATA"; payload: VideoMetadata }
	| { type: "UPDATE_SETTINGS"; payload: Partial<ConversionSettings> }
	| { type: "SET_STATUS"; payload: ConverterState["conversionStatus"] }
	| { type: "SET_PROGRESS"; payload: number }
	| { type: "SET_GIF_BLOB"; payload: Blob }
	| { type: "SET_ERROR"; payload: ErrorState }
	| { type: "CLEAR_ERROR" }
	| { type: "SET_FFMPEG_LOADED"; payload: boolean }
	| { type: "RESET" };

// Initial state
const initialState: ConverterState = {
	uploadedFile: null,
	videoMetadata: null,
	settings: {
		quality: 80,
		frameRate: 15,
		width: 800,
		height: 600,
		startTime: 0,
		endTime: 0,
	},
	conversionStatus: "idle",
	progress: 0,
	gifBlob: null,
	error: null,
	ffmpegLoaded: false,
};

// Reducer function for complex state management
function converterReducer(
	state: ConverterState,
	action: ConverterAction,
): ConverterState {
	switch (action.type) {
		case "SET_FILE":
			return {
				...state,
				uploadedFile: action.payload,
				videoMetadata: null,
				gifBlob: null,
				progress: 0,
				conversionStatus: "idle",
				error: null,
			};
		case "SET_METADATA": {
			// Set default width to min(videoWidth, 800)
			const defaultWidth = Math.min(action.payload.width, 800);
			const defaultHeight = Math.round(
				defaultWidth / action.payload.aspectRatio,
			);
			return {
				...state,
				videoMetadata: action.payload,
				settings: {
					...state.settings,
					width: defaultWidth,
					height: defaultHeight,
					startTime: 0,
					endTime: action.payload.duration,
				},
			};
		}
		case "UPDATE_SETTINGS":
			return {
				...state,
				settings: {
					...state.settings,
					...action.payload,
				},
			};
		case "SET_STATUS":
			return {
				...state,
				conversionStatus: action.payload,
			};
		case "SET_PROGRESS":
			return {
				...state,
				progress: action.payload,
			};
		case "SET_GIF_BLOB":
			return {
				...state,
				gifBlob: action.payload,
				conversionStatus: "complete",
				progress: 100,
			};
		case "SET_ERROR":
			return {
				...state,
				error: action.payload,
				conversionStatus: "error",
			};
		case "CLEAR_ERROR":
			return {
				...state,
				error: null,
			};
		case "SET_FFMPEG_LOADED":
			return {
				...state,
				ffmpegLoaded: action.payload,
			};
		case "RESET":
			return {
				...initialState,
				ffmpegLoaded: state.ffmpegLoaded,
			};
		default:
			return state;
	}
}

export default function VideoConverterPage() {
	const [state, dispatch] = useReducer(converterReducer, initialState);
	const [browserCompatibility, setBrowserCompatibility] = useState(() =>
		checkBrowserCompatibility(),
	);
	const [currentVideoTime, setCurrentVideoTime] = useState(0);
	const [showShortcutsOverlay, setShowShortcutsOverlay] = useState(false);
	const videoPreviewRef = useRef<VideoPreviewRef>(null);

	// Lazy load FFmpeg only when user attempts to convert
	// Performance: Lazy loading - FFmpeg is only loaded when first needed
	// Requirement 8.1: Perform all video processing using WASM Processing
	// Requirement 8.3: Load WASM modules within 5 seconds
	// Requirement 8.4: Display loading indicator while WASM modules are initializing
	const initializeFFmpeg = useCallback(async () => {
		if (ffmpegService.isLoaded()) {
			dispatch({ type: "SET_FFMPEG_LOADED", payload: true });
			return;
		}

		try {
			dispatch({ type: "SET_STATUS", payload: "loading" });
			await ffmpegService.initialize();
			dispatch({ type: "SET_FFMPEG_LOADED", payload: true });
			dispatch({ type: "SET_STATUS", payload: "idle" });
		} catch (error) {
			// Requirement 8.5: Display error message with troubleshooting guidance
			let errorMessage =
				"Failed to initialize FFmpeg. Please refresh the page and try again.";

			if (error instanceof Error) {
				if (
					error.message.includes("network") ||
					error.message.includes("fetch")
				) {
					errorMessage =
						"Failed to load video processing library due to network issues. Please check your internet connection and try again.";
				} else if (error.message.includes("timeout")) {
					errorMessage =
						"Loading video processing library timed out. Please check your internet connection and try again.";
				} else {
					errorMessage = error.message;
				}
			}

			dispatch({
				type: "SET_ERROR",
				payload: {
					type: "ffmpeg",
					message: errorMessage,
					recoverable: true,
					retryAction: () => initializeFFmpeg(),
				},
			});
			throw error;
		}
	}, []);

	// Set page title
	// Requirement: All requirements (page accessibility)
	useEffect(() => {
		document.title = "Video to GIF Converter - Convert Videos to GIF Online";
	}, []);

	// Check browser compatibility on mount
	// Requirement 8.5: Display browser compatibility warnings for unsupported features
	useEffect(() => {
		const compatibility = checkBrowserCompatibility();
		setBrowserCompatibility(compatibility);

		if (!compatibility.isCompatible) {
			dispatch({
				type: "SET_ERROR",
				payload: {
					type: "ffmpeg",
					message:
						"Your browser does not support the required features for video conversion. Please use a modern browser.",
					recoverable: false,
				},
			});
		}

		// Cleanup on unmount
		return () => {
			if (ffmpegService.isLoaded()) {
				ffmpegService.terminate();
			}
		};
	}, []);

	// File upload handler with validation
	// Requirements 1.1-1.5: File upload functionality
	const handleFileSelect = useCallback((file: File) => {
		dispatch({ type: "SET_FILE", payload: file });
		dispatch({ type: "CLEAR_ERROR" });
	}, []);

	// Metadata extraction handler
	// Requirements 2.1-2.5: Video preview and metadata display
	const handleMetadataLoad = useCallback((metadata: VideoMetadata) => {
		dispatch({ type: "SET_METADATA", payload: metadata });
	}, []);

	// Settings change handler
	const handleSettingsChange = useCallback((settings: ConversionSettings) => {
		dispatch({ type: "UPDATE_SETTINGS", payload: settings });
	}, []);

	// Timeline trim handler
	const handleTimeRangeChange = useCallback(
		(startTime: number, endTime: number) => {
			dispatch({
				type: "UPDATE_SETTINGS",
				payload: { startTime, endTime },
			});
		},
		[],
	);

	// Video time update handler
	const handleVideoTimeUpdate = useCallback((time: number) => {
		setCurrentVideoTime(time);
	}, []);

	// Timeline seek handler
	const handleTimelineSeek = useCallback((time: number) => {
		videoPreviewRef.current?.seek(time);
	}, []);

	// Keyboard shortcuts for video control and help overlay
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Don't trigger if user is typing in an input field
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement
			) {
				return;
			}

			// Help overlay toggle with "?"
			if (e.key === "?" || e.key === "/") {
				e.preventDefault();
				setShowShortcutsOverlay((prev) => !prev);
				return;
			}

			const video = videoPreviewRef.current?.getVideoElement();
			if (!video) return;

			switch (e.key) {
				case " ": {
					e.preventDefault();
					videoPreviewRef.current?.togglePlayPause();
					break;
				}
				case "ArrowLeft": {
					e.preventDefault();
					// Move back 1 second (or 0.1 seconds with Shift)
					const backwardAmount = e.shiftKey ? 0.1 : 1;
					const newTimeBackward = Math.max(
						0,
						video.currentTime - backwardAmount,
					);
					videoPreviewRef.current?.seek(newTimeBackward);
					break;
				}
				case "ArrowRight": {
					e.preventDefault();
					// Move forward 1 second (or 0.1 seconds with Shift)
					const forwardAmount = e.shiftKey ? 0.1 : 1;
					const newTimeForward = Math.min(
						video.duration,
						video.currentTime + forwardAmount,
					);
					videoPreviewRef.current?.seek(newTimeForward);
					break;
				}
				case "ArrowUp": {
					e.preventDefault();
					// Move forward 5 seconds
					const newTimeUp = Math.min(video.duration, video.currentTime + 5);
					videoPreviewRef.current?.seek(newTimeUp);
					break;
				}
				case "ArrowDown": {
					e.preventDefault();
					// Move back 5 seconds
					const newTimeDown = Math.max(0, video.currentTime - 5);
					videoPreviewRef.current?.seek(newTimeDown);
					break;
				}
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	// Conversion workflow orchestration
	// Requirements 6.1-6.5: Conversion progress and error handling
	// Requirement 6.3: Disable controls during active conversion
	const handleConvert = useCallback(async () => {
		if (!state.uploadedFile || !state.videoMetadata) {
			return;
		}

		// Timeout controller for 5 minute max conversion time
		const CONVERSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds
		const timeoutController = new AbortController();
		const timeoutId = setTimeout(() => {
			timeoutController.abort();
		}, CONVERSION_TIMEOUT);

		try {
			// Lazy load FFmpeg if not already loaded
			// Performance: Lazy loading - only loads when first conversion is attempted
			if (!state.ffmpegLoaded) {
				await initializeFFmpeg();
			}

			// Set processing status
			// Requirement 6.3: Disable convert button during processing
			dispatch({ type: "SET_STATUS", payload: "processing" });
			dispatch({ type: "SET_PROGRESS", payload: 0 });
			dispatch({ type: "CLEAR_ERROR" });

			// Progress callback
			// Requirement 6.2: Update progress bar at intervals not exceeding 1 second
			const onProgress = (progress: number) => {
				dispatch({ type: "SET_PROGRESS", payload: progress });
			};

			// Create conversion promise
			// Requirement 8.1: Perform all video processing using WASM Processing
			// Requirement 8.2: Do NOT transmit any Video File data to external servers
			const conversionPromise = ffmpegService.convertToGif(
				state.uploadedFile,
				state.settings,
				onProgress,
			);

			// Create timeout promise
			const timeoutPromise = new Promise<never>((_, reject) => {
				timeoutController.signal.addEventListener("abort", () => {
					reject(
						new Error(
							"Conversion timed out after 5 minutes. Please try with a shorter video or reduce the quality settings.",
						),
					);
				});
			});

			// Race between conversion and timeout
			const gifBlob = await Promise.race([conversionPromise, timeoutPromise]);

			// Clear timeout if conversion completed successfully
			clearTimeout(timeoutId);

			// Set GIF blob and complete status
			// Requirement 6.4: Display completion message
			dispatch({ type: "SET_GIF_BLOB", payload: gifBlob });
		} catch (error) {
			// Clear timeout on error
			clearTimeout(timeoutId);

			// Requirement 6.5: Display error message with description of failure
			// Provide user-friendly error messages based on error type
			let errorMessage = "An unexpected error occurred during conversion.";
			const errorType: ErrorState["type"] = "conversion";

			if (error instanceof Error) {
				if (error.message.includes("timed out")) {
					errorMessage = error.message;
				} else if (
					error.message.includes("memory") ||
					error.message.includes("out of memory")
				) {
					errorMessage =
						"Not enough memory to process this video. Try reducing the video dimensions, quality settings, or use a shorter video clip.";
				} else if (
					error.message.includes("format") ||
					error.message.includes("codec")
				) {
					errorMessage =
						"This video format or codec may not be supported. Please try converting the video to MP4 format first, or try a different video file.";
				} else if (
					error.message.includes("corrupted") ||
					error.message.includes("invalid")
				) {
					errorMessage =
						"The video file appears to be corrupted or invalid. Please try a different video file.";
				} else if (error.message.includes("abort")) {
					errorMessage = "Conversion was cancelled. Please try again.";
				} else {
					errorMessage = error.message;
				}
			}

			dispatch({
				type: "SET_ERROR",
				payload: {
					type: errorType,
					message: errorMessage,
					recoverable: true,
					retryAction: handleConvert,
				},
			});
		}
	}, [
		state.uploadedFile,
		state.videoMetadata,
		state.ffmpegLoaded,
		state.settings,
		initializeFFmpeg,
	]);

	// Reset handler for "Convert Another" functionality
	// Requirement 7.5: Allow user to convert another video without page refresh
	const handleReset = useCallback(() => {
		dispatch({ type: "RESET" });
	}, []);

	// Retry error handler
	const handleRetry = useCallback(() => {
		if (state.error?.retryAction) {
			dispatch({ type: "CLEAR_ERROR" });
			state.error.retryAction();
		}
	}, [state.error]);

	const isConverting = state.conversionStatus === "processing";
	const isLoading = state.conversionStatus === "loading";

	return (
		<>
			{/* Keyboard Shortcuts Overlay */}
			<KeyboardShortcutsOverlay
				isOpen={showShortcutsOverlay}
				onClose={() => setShowShortcutsOverlay(false)}
			/>

			<DefaultLayout onHelpClick={() => setShowShortcutsOverlay(true)}>
				<div className="min-h-screen bg-linear-to-br from-background via-background to-primary-50/30 dark:to-primary-950/10">
					{/* Sticky action bar - positioned at top level for proper stickiness */}
					{state.uploadedFile && state.videoMetadata && !state.gifBlob && (
						<motion.div
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							className="sticky top-16 z-20 border-divider/50 border-b bg-content1/95 shadow-lg shadow-primary-500/10 backdrop-blur-xl"
						>
							<div className="mx-auto max-w-5xl px-4 py-4 sm:px-6">
								<div className="flex flex-wrap items-center justify-between gap-4">
									<div className="flex min-w-0 flex-1 items-center gap-3">
										<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30">
											<svg
												className="h-5 w-5 text-primary-600 dark:text-primary-400"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
												/>
											</svg>
										</div>
										<div className="min-w-0 flex-1">
											<div className="flex items-center gap-2">
												<p className="truncate font-semibold text-foreground text-sm">
													{state.uploadedFile.name}
												</p>
												<button
													type="button"
													onClick={() => setShowShortcutsOverlay(true)}
													className="hidden items-center gap-1 rounded-md bg-primary-100 px-2 py-0.5 font-medium text-primary-700 text-xs transition-colors hover:bg-primary-200 sm:flex dark:bg-primary-900/30 dark:text-primary-400 dark:hover:bg-primary-900/50"
												>
													<svg
														className="h-3 w-3"
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
													<span>Press ? for shortcuts</span>
												</button>
											</div>
											<p className="text-default-500 text-xs">
												{state.videoMetadata.width}×{state.videoMetadata.height}{" "}
												• {state.videoMetadata.duration.toFixed(1)}s
											</p>
										</div>
									</div>
									<div className="flex items-center gap-2">
										<Button
											color="primary"
											size="lg"
											onPress={handleConvert}
											isDisabled={
												!state.uploadedFile ||
												!state.videoMetadata ||
												isConverting ||
												isLoading
											}
											isLoading={isConverting || isLoading}
											className="font-semibold shadow-lg shadow-primary-500/30"
											startContent={
												!isConverting && (
													<svg
														className="h-5 w-5"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M13 10V3L4 14h7v7l9-11h-7z"
														/>
													</svg>
												)
											}
										>
											{isConverting ? "Converting..." : "Convert to GIF"}
										</Button>
										<Button
											color="default"
											variant="flat"
											size="lg"
											onPress={handleReset}
											isIconOnly
										>
											<svg
												className="h-5 w-5"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M6 18L18 6M6 6l12 12"
												/>
											</svg>
										</Button>
									</div>
								</div>
							</div>
						</motion.div>
					)}

					{/* Main content area */}
					<div className="mx-auto max-w-5xl px-4 py-2 sm:px-6 sm:py-4">
						{/* Warnings */}
						{!browserCompatibility.isCompatible && (
							<motion.div
								initial={{ opacity: 0, y: -10 }}
								animate={{ opacity: 1, y: 0 }}
								className="mb-6"
							>
								<BrowserCompatibilityWarning
									missingFeatures={browserCompatibility.missingFeatures}
								/>
							</motion.div>
						)}

						{state.error && (
							<motion.div
								initial={{ opacity: 0, y: -10 }}
								animate={{ opacity: 1, y: 0 }}
								className="mb-6"
							>
								<ErrorMessage
									error={state.error}
									onRetry={handleRetry}
									onReset={handleReset}
									onDismiss={() => dispatch({ type: "CLEAR_ERROR" })}
								/>
							</motion.div>
						)}

						{state.uploadedFile && (
							<motion.div
								initial={{ opacity: 0, y: -10 }}
								animate={{ opacity: 1, y: 0 }}
								className="mb-6"
							>
								<FileSizeWarning
									fileSize={state.uploadedFile.size}
									fileName={state.uploadedFile.name}
								/>
							</motion.div>
						)}

						{/* Upload state - Hero section */}
						<AnimatePresence mode="wait">
							{!state.uploadedFile && (
								<motion.div
									key="upload"
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -20 }}
									transition={{ duration: 0.4 }}
									className="flex min-h-[70vh] flex-col items-center justify-center"
								>
									<div className="w-full max-w-3xl space-y-8">
										<motion.div
											initial={{ opacity: 0, y: 10 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: 0.1, duration: 0.4 }}
											className="mb-8 space-y-4 text-center"
										>
											<div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-br from-primary-500 to-secondary-500 shadow-lg shadow-primary-500/30">
												<svg
													className="h-10 w-10 text-white"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
													/>
												</svg>
											</div>
											<h1 className="bg-linear-to-r from-foreground to-foreground/70 bg-clip-text font-bold text-4xl text-transparent sm:text-5xl">
												Video to GIF Converter
											</h1>
											<p className="mx-auto max-w-xl text-base text-default-600 sm:text-lg">
												Transform your videos into high-quality GIF animations
												with professional editing tools
											</p>
										</motion.div>
										<motion.div
											initial={{ opacity: 0, scale: 0.95 }}
											animate={{ opacity: 1, scale: 1 }}
											transition={{ delay: 0.2, duration: 0.4 }}
										>
											<FileUploadZone
												onFileSelect={handleFileSelect}
												acceptedFormats={ACCEPTED_FORMATS}
												disabled={isLoading}
											/>
										</motion.div>

										{/* Feature highlights */}
										<motion.div
											initial={{ opacity: 0, y: 10 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: 0.3, duration: 0.4 }}
											className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3"
										>
											<div className="rounded-xl border border-divider/50 bg-content1/50 p-4 text-center backdrop-blur-sm">
												<div className="mb-2 text-2xl">⚡</div>
												<div className="mb-1 font-semibold text-foreground text-sm">
													Lightning Fast
												</div>
												<div className="text-default-500 text-xs">
													Client-side processing
												</div>
											</div>
											<div className="rounded-xl border border-divider/50 bg-content1/50 p-4 text-center backdrop-blur-sm">
												<div className="mb-2 text-2xl">🔒</div>
												<div className="mb-1 font-semibold text-foreground text-sm">
													100% Private
												</div>
												<div className="text-default-500 text-xs">
													Never leaves your device
												</div>
											</div>
											<div className="rounded-xl border border-divider/50 bg-content1/50 p-4 text-center backdrop-blur-sm">
												<div className="mb-2 text-2xl">✂️</div>
												<div className="mb-1 font-semibold text-foreground text-sm">
													Pro Editing
												</div>
												<div className="text-default-500 text-xs">
													Timeline trimming tools
												</div>
											</div>
										</motion.div>
									</div>
								</motion.div>
							)}
						</AnimatePresence>

						{/* Working state - Modern single column layout */}
						{state.uploadedFile && state.videoMetadata && !state.gifBlob && (
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								className="space-y-6"
							>
								{/* Video preview */}
								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.1 }}
								>
									<VideoPreview
										ref={videoPreviewRef}
										file={state.uploadedFile}
										onMetadataLoad={handleMetadataLoad}
										onTimeUpdate={handleVideoTimeUpdate}
									/>
								</motion.div>

								{/* Timeline */}
								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.2 }}
								>
									<VideoTimeline
										duration={state.videoMetadata.duration}
										startTime={state.settings.startTime}
										endTime={state.settings.endTime}
										currentTime={currentVideoTime}
										onTimeRangeChange={handleTimeRangeChange}
										onSeek={handleTimelineSeek}
										disabled={isConverting || isLoading}
									/>
								</motion.div>

								{/* Conversion controls */}
								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.3 }}
								>
									<ConversionControls
										videoMetadata={state.videoMetadata}
										settings={state.settings}
										onSettingsChange={handleSettingsChange}
										disabled={isConverting || isLoading}
									/>
								</motion.div>
							</motion.div>
						)}

						{/* Result state - Modern layout */}
						{state.uploadedFile && state.videoMetadata && state.gifBlob && (
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								className="space-y-6"
							>
								{/* Success header */}
								<motion.div
									initial={{ opacity: 0, y: -10 }}
									animate={{ opacity: 1, y: 0 }}
									className="rounded-2xl border border-success-200/50 bg-linear-to-r from-success-50 to-primary-50 p-6 shadow-lg backdrop-blur-xl dark:border-success-800/50 dark:from-success-950/30 dark:to-primary-950/30"
								>
									<div className="flex flex-wrap items-start gap-4">
										<motion.div
											initial={{ scale: 0 }}
											animate={{ scale: 1 }}
											transition={{
												type: "spring",
												stiffness: 200,
												damping: 10,
											}}
											className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-success-500 shadow-lg shadow-success-500/30"
										>
											<svg
												className="h-6 w-6 text-white"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M5 13l4 4L19 7"
												/>
											</svg>
										</motion.div>
										<div className="min-w-0 flex-1">
											<h2 className="mb-3 font-bold text-success-700 text-xl dark:text-success-400">
												Conversion Complete!
											</h2>
											<div className="mb-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
												<div>
													<p className="mb-1 text-success-600 text-xs dark:text-success-500">
														File Size
													</p>
													<p className="font-semibold text-success-700 dark:text-success-400">
														{(state.gifBlob.size / (1024 * 1024)).toFixed(2)} MB
													</p>
												</div>
												<div>
													<p className="mb-1 text-success-600 text-xs dark:text-success-500">
														Quality
													</p>
													<p className="font-semibold text-success-700 dark:text-success-400">
														{state.settings.quality}%
													</p>
												</div>
												<div>
													<p className="mb-1 text-success-600 text-xs dark:text-success-500">
														Frame Rate
													</p>
													<p className="font-semibold text-success-700 dark:text-success-400">
														{state.settings.frameRate} fps
													</p>
												</div>
												<div>
													<p className="mb-1 text-success-600 text-xs dark:text-success-500">
														Dimensions
													</p>
													<p className="font-semibold text-success-700 dark:text-success-400">
														{state.settings.width}×{state.settings.height}
													</p>
												</div>
											</div>
										</div>
										<div className="flex flex-col gap-2 sm:flex-row">
											<Button
												color="success"
												size="lg"
												onPress={() => {
													if (!state.gifBlob) return;
													const url = URL.createObjectURL(state.gifBlob);
													const a = document.createElement("a");
													a.href = url;
													a.download = state.uploadedFile
														? state.uploadedFile.name.replace(
																/\.[^/.]+$/,
																".gif",
															)
														: "converted.gif";
													document.body.appendChild(a);
													a.click();
													document.body.removeChild(a);
													URL.revokeObjectURL(url);
												}}
												className="font-semibold shadow-lg shadow-success-500/30"
												startContent={
													<svg
														className="h-5 w-5"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
														/>
													</svg>
												}
											>
												Download GIF
											</Button>
											<Button
												color="default"
												variant="flat"
												size="lg"
												onPress={handleReset}
												className="font-semibold"
											>
												Convert Another
											</Button>
										</div>
									</div>
								</motion.div>

								{/* Converted GIF */}
								<motion.div
									initial={{ opacity: 0, x: 20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: 0.2 }}
								>
									<div className="mb-3">
										<h3 className="font-semibold text-default-600 text-sm uppercase tracking-wide">
											Converted GIF
										</h3>
									</div>
									<Card className="overflow-hidden border-2 border-success-200 shadow-success-500/10 shadow-xl dark:border-success-800">
										<CardBody className="p-0">
											<img
												src={URL.createObjectURL(state.gifBlob)}
												alt="Converted GIF"
												className="h-auto w-full object-contain"
											/>
										</CardBody>
									</Card>
								</motion.div>
							</motion.div>
						)}

						{/* Loading metadata state */}
						{state.uploadedFile && !state.videoMetadata && (
							<div className="mx-auto max-w-4xl">
								<VideoPreview
									file={state.uploadedFile}
									onMetadataLoad={handleMetadataLoad}
								/>
							</div>
						)}

						{/* Conversion progress */}
						{(state.conversionStatus === "processing" ||
							state.conversionStatus === "loading") && (
							<div className="mx-auto mt-6 max-w-2xl">
								<ConversionProgress
									progress={state.progress}
									status={state.conversionStatus}
									message={state.error?.message}
								/>
							</div>
						)}
					</div>
				</div>
			</DefaultLayout>
		</>
	);
}
