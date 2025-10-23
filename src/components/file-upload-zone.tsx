import { Card, CardBody } from "@heroui/card";
import clsx from "clsx";
import { type DragEvent, type FC, memo, useRef, useState } from "react";

interface FileUploadZoneProps {
	onFileSelect: (file: File) => void;
	acceptedFormats: string[];
	disabled?: boolean;
}

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB in bytes

const SUPPORTED_FORMATS = {
	"video/mp4": [".mp4"],
	"video/webm": [".webm"],
	"video/quicktime": [".mov"],
	"video/x-msvideo": [".avi"],
};

const FileUploadZoneComponent: FC<FileUploadZoneProps> = ({
	onFileSelect,
	acceptedFormats,
	disabled = false,
}) => {
	const [isDragActive, setIsDragActive] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const validateFile = (file: File): string | null => {
		// Check file type
		const isValidFormat = acceptedFormats.some((format) =>
			file.type.startsWith(format),
		);

		if (!isValidFormat) {
			const supportedExtensions = Object.values(SUPPORTED_FORMATS)
				.flat()
				.join(", ");
			return `Unsupported file format. Please upload one of the following: ${supportedExtensions}`;
		}

		// Check file size
		if (file.size > MAX_FILE_SIZE) {
			const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024);
			return `File size exceeds ${maxSizeMB}MB limit. Please choose a smaller file.`;
		}

		return null;
	};

	const handleFile = (file: File) => {
		if (disabled) return;

		const validationError = validateFile(file);
		if (validationError) {
			setError(validationError);
			return;
		}

		setError(null);
		onFileSelect(file);
	};

	const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		if (!disabled) {
			setIsDragActive(true);
		}
	};

	const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragActive(false);
	};

	const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const handleDrop = (e: DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragActive(false);

		if (disabled) return;

		const files = e.dataTransfer.files;
		if (files && files.length > 0) {
			handleFile(files[0]);
		}
	};

	const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (files && files.length > 0) {
			handleFile(files[0]);
		}
	};

	const handleClick = () => {
		if (!disabled && fileInputRef.current) {
			fileInputRef.current.click();
		}
	};

	return (
		<div className="flex w-full items-center justify-center">
			<Card
				isPressable={!disabled}
				onPress={handleClick}
				className={clsx("border-2 border-dashed transition-all duration-200", {
					"border-primary bg-primary-50 dark:bg-primary-950/20":
						isDragActive && !disabled,
					"border-default-300 hover:border-primary hover:bg-default-100":
						!isDragActive && !disabled,
					"border-danger bg-danger-50 dark:bg-danger-950/20": error,
					"cursor-not-allowed opacity-50": disabled,
				})}
			>
				<CardBody
					className="px-6 py-10 sm:py-12 md:py-14"
					onDragEnter={handleDragEnter}
					onDragLeave={handleDragLeave}
					onDragOver={handleDragOver}
					onDrop={handleDrop}
				>
					<div className="flex min-h-[180px] flex-col items-center justify-center gap-4 text-center sm:min-h-[200px] sm:gap-5">
						<div
							className={clsx(
								"flex min-h-20 min-w-20 items-center justify-center rounded-full p-5 transition-colors sm:p-6",
								{
									"bg-primary-100 dark:bg-primary-900/30":
										isDragActive && !disabled,
									"bg-default-100 dark:bg-default-800": !isDragActive && !error,
									"bg-danger-100 dark:bg-danger-900/30": error,
								},
							)}
						>
							<svg
								className={clsx("h-14 w-14 sm:h-16 sm:w-16", {
									"text-primary": isDragActive && !disabled,
									"text-default-400": !isDragActive && !error,
									"text-danger": error,
								})}
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
								/>
							</svg>
						</div>

						<div className="space-y-2 px-2 sm:space-y-3">
							<p className="font-semibold text-foreground text-xl sm:text-2xl">
								{isDragActive
									? "Drop your video here"
									: "Drag and drop your video"}
							</p>
							<p className="text-default-500 text-sm sm:text-base">
								or click to browse files
							</p>
							<p className="text-default-400 text-xs sm:text-sm">
								Supported formats: MP4, WebM, MOV, AVI (max 500MB)
							</p>
						</div>
					</div>

					<input
						ref={fileInputRef}
						type="file"
						accept={acceptedFormats.join(",")}
						onChange={handleFileInputChange}
						className="hidden"
						disabled={disabled}
						aria-label="Upload video file"
					/>
				</CardBody>
			</Card>

			{error && (
				<div className="mt-3 rounded-lg border border-danger-200 bg-danger-50 p-3 sm:p-4 dark:border-danger-800 dark:bg-danger-950/20">
					<p className="text-danger-600 text-xs sm:text-sm dark:text-danger-400">
						{error}
					</p>
				</div>
			)}
		</div>
	);
};

// Performance: Memoize component to prevent unnecessary re-renders
export const FileUploadZone = memo(FileUploadZoneComponent);
