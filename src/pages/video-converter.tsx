import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { useCallback, useEffect, useReducer, useState } from "react";
import { BrowserCompatibilityWarning } from "@/components/browser-compatibility-warning";
import { ConversionControls } from "@/components/conversion-controls";
import { ConversionProgress } from "@/components/conversion-progress";
import { ErrorMessage } from "@/components/error-message";
import { FileSizeWarning } from "@/components/file-size-warning";
import { FileUploadZone } from "@/components/file-upload-zone";
import { VideoPreview } from "@/components/video-preview";
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
	// Performance: Allow conversion even if FFmpeg not loaded (lazy loading)
	const canConvert =
		state.uploadedFile && state.videoMetadata && !isConverting && !isLoading;

	return (
		<DefaultLayout>
			<div className="flex flex-col h-[calc(100vh-64px)]">
				{/* Toolbar */}
				{state.uploadedFile && state.videoMetadata && (
					<div className="border-b border-divider bg-content1">
						<div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
							<div className="flex flex-wrap items-center gap-3 sm:gap-4">
								{/* File info */}
								<div className="flex items-center gap-2 min-w-0 flex-1">
									<svg
										className="w-5 h-5 text-default-400 flex-shrink-0"
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
									<span className="text-sm font-medium text-foreground truncate">
										{state.uploadedFile.name}
									</span>
								</div>

								{/* Action buttons */}
								<div className="flex items-center gap-2">
									{!state.gifBlob && (
										<Button
											color="primary"
											size="sm"
											onPress={handleConvert}
											isDisabled={!canConvert}
											isLoading={isConverting || isLoading}
											className="min-w-[120px]"
										>
											{isConverting ? "Converting..." : "Convert to GIF"}
										</Button>
									)}
									{state.gifBlob && (
										<>
											<Button
												color="primary"
												size="sm"
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
												startContent={
													<svg
														className="w-4 h-4"
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
												size="sm"
												onPress={handleReset}
											>
												New Video
											</Button>
										</>
									)}
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Main content area */}
				<div className="flex-1 overflow-auto">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
						{/* Warnings */}
						{!browserCompatibility.isCompatible && (
							<div className="mb-4">
								<BrowserCompatibilityWarning
									missingFeatures={browserCompatibility.missingFeatures}
								/>
							</div>
						)}

						{state.error && (
							<div className="mb-4">
								<ErrorMessage
									error={state.error}
									onRetry={handleRetry}
									onReset={handleReset}
									onDismiss={() => dispatch({ type: "CLEAR_ERROR" })}
								/>
							</div>
						)}

						{state.uploadedFile && (
							<div className="mb-4">
								<FileSizeWarning
									fileSize={state.uploadedFile.size}
									fileName={state.uploadedFile.name}
								/>
							</div>
						)}

						{/* Upload state */}
						{!state.uploadedFile && (
							<div className="flex flex-col items-center justify-center min-h-[60vh]">
								<div className="max-w-2xl w-full space-y-4">
									<div className="text-center space-y-2 mb-6">
										<h1 className="text-2xl sm:text-3xl font-bold text-foreground">
											Video to GIF Converter
										</h1>
										<p className="text-sm sm:text-base text-default-600">
											Convert your videos to high-quality GIF animations
										</p>
									</div>
									<FileUploadZone
										onFileSelect={handleFileSelect}
										acceptedFormats={ACCEPTED_FORMATS}
										disabled={isLoading}
									/>
								</div>
							</div>
						)}

						{/* Working state - Two column layout */}
						{state.uploadedFile && state.videoMetadata && !state.gifBlob && (
							<div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-180px)]">
								<div className="flex-1 overflow-hidden">
									<VideoPreview
										file={state.uploadedFile}
										onMetadataLoad={handleMetadataLoad}
									/>
								</div>
								<div className="w-full lg:w-[400px] overflow-y-auto flex-shrink-0">
									<ConversionControls
										videoMetadata={state.videoMetadata}
										settings={state.settings}
										onSettingsChange={handleSettingsChange}
										disabled={isConverting || isLoading}
									/>
								</div>
							</div>
						)}

						{/* Loading metadata state */}
						{state.uploadedFile && !state.videoMetadata && (
							<div className="max-w-4xl mx-auto">
								<VideoPreview
									file={state.uploadedFile}
									onMetadataLoad={handleMetadataLoad}
								/>
							</div>
						)}

						{/* Conversion progress */}
						{(state.conversionStatus === "processing" ||
							state.conversionStatus === "loading") && (
							<div className="max-w-2xl mx-auto mt-6">
								<ConversionProgress
									progress={state.progress}
									status={state.conversionStatus}
									message={state.error?.message}
								/>
							</div>
						)}

						{/* Result state - Show converted GIF */}
						{state.gifBlob && state.uploadedFile && state.videoMetadata && (
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-180px)]">
								{/* Left: Original video */}
								<div className="flex flex-col overflow-hidden">
									<h3 className="text-xs font-semibold text-default-500 mb-2 px-1">
										ORIGINAL VIDEO
									</h3>
									<div className="flex-1 overflow-hidden">
										<VideoPreview
											file={state.uploadedFile}
											onMetadataLoad={handleMetadataLoad}
										/>
									</div>
								</div>

								{/* Right: Converted GIF with info */}
								<div className="flex flex-col overflow-hidden">
									<h3 className="text-xs font-semibold text-default-500 mb-2 px-1">
										CONVERTED GIF
									</h3>
									<Card className="flex-1 flex flex-col">
										<CardBody className="p-3 flex-1 flex items-center justify-center overflow-hidden">
											<img
												src={
													state.gifBlob
														? URL.createObjectURL(state.gifBlob)
														: ""
												}
												alt="Converted GIF"
												className="w-full h-auto object-contain rounded-lg"
												style={{ maxHeight: "calc(100vh - 380px)" }}
											/>
										</CardBody>
									</Card>
									<div className="mt-3 p-4 rounded-lg bg-success-50 dark:bg-success-950/20 border border-success-200 dark:border-success-800">
										<div className="flex items-start gap-3">
											<svg
												className="w-5 h-5 text-success-600 dark:text-success-400 flex-shrink-0 mt-0.5"
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
											<div className="flex-1">
												<p className="text-sm font-semibold text-success-700 dark:text-success-400 mb-2">
													Conversion Complete!
												</p>
												<div className="grid grid-cols-2 gap-2 text-xs">
													<div>
														<span className="text-success-600 dark:text-success-500">
															Output size:
														</span>
														<p className="font-semibold text-success-700 dark:text-success-400">
															{(state.gifBlob.size / (1024 * 1024)).toFixed(2)}{" "}
															MB
														</p>
													</div>
													<div>
														<span className="text-success-600 dark:text-success-500">
															Settings:
														</span>
														<p className="font-semibold text-success-700 dark:text-success-400">
															{state.settings.quality}% •{" "}
															{state.settings.frameRate}
															fps • {state.settings.width}px
														</p>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</DefaultLayout>
	);
}
