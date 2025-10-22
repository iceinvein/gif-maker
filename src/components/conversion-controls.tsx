import { Card, CardBody, CardHeader } from "@heroui/card";
import { Select, SelectItem } from "@heroui/select";
import { Slider } from "@heroui/slider";
import { type FC, memo, useEffect, useMemo, useState } from "react";
import type { ConversionSettings, VideoMetadata } from "@/types";

interface ConversionControlsProps {
	videoMetadata: VideoMetadata;
	settings: ConversionSettings;
	onSettingsChange: (settings: ConversionSettings) => void;
	disabled?: boolean;
}

const FRAME_RATE_OPTIONS = [
	{ value: 10, label: "10 fps" },
	{ value: 15, label: "15 fps" },
	{ value: 20, label: "20 fps" },
	{ value: 24, label: "24 fps" },
	{ value: 30, label: "30 fps" },
];

const ConversionControlsComponent: FC<ConversionControlsProps> = ({
	videoMetadata,
	settings,
	onSettingsChange,
	disabled = false,
}) => {
	const [showFrameRateWarning, setShowFrameRateWarning] = useState(false);

	// Calculate height based on width and aspect ratio
	const calculatedHeight = useMemo(() => {
		return Math.round(settings.width / videoMetadata.aspectRatio);
	}, [settings.width, videoMetadata.aspectRatio]);

	// Update height when width changes
	useEffect(() => {
		if (calculatedHeight !== settings.height) {
			onSettingsChange({
				...settings,
				height: calculatedHeight,
			});
		}
	}, [calculatedHeight, settings, onSettingsChange]);

	// Check if frame rate exceeds source video frame rate
	useEffect(() => {
		setShowFrameRateWarning(settings.frameRate > videoMetadata.frameRate);
	}, [settings.frameRate, videoMetadata.frameRate]);

	const handleQualityChange = (value: number | number[]) => {
		const qualityValue = Array.isArray(value) ? value[0] : value;
		onSettingsChange({
			...settings,
			quality: qualityValue,
		});
	};

	const handleFrameRateChange = (value: string) => {
		const frameRateValue = Number.parseInt(value, 10);
		onSettingsChange({
			...settings,
			frameRate: frameRateValue,
		});
	};

	const handleWidthChange = (value: number | number[]) => {
		const widthValue = Array.isArray(value) ? value[0] : value;
		onSettingsChange({
			...settings,
			width: widthValue,
		});
	};

	return (
		<Card className="w-full">
			<CardHeader className="pb-2 px-3 sm:px-4">
				<h3 className="text-base sm:text-lg font-semibold text-foreground">
					Conversion Settings
				</h3>
			</CardHeader>
			<CardBody className="space-y-5 sm:space-y-6 px-3 sm:px-4">
				{/* Quality Slider */}
				<div className="space-y-2 touch-manipulation">
					<Slider
						label="Quality"
						minValue={1}
						maxValue={100}
						value={settings.quality}
						onChange={handleQualityChange}
						isDisabled={disabled}
						className="w-full"
						aria-label="Quality slider"
						marks={[
							{ value: 1, label: "1" },
							{ value: 25, label: "25" },
							{ value: 50, label: "50" },
							{ value: 75, label: "75" },
							{ value: 100, label: "100" },
						]}
					/>
					<div className="flex justify-between items-center text-xs sm:text-sm min-h-[44px] sm:min-h-0">
						<span className="text-default-500">Current value:</span>
						<span className="font-semibold text-foreground">
							{settings.quality}%
						</span>
					</div>
				</div>

				{/* Frame Rate Selector */}
				<div className="space-y-2 touch-manipulation">
					<Select
						label="Frame Rate"
						selectedKeys={[settings.frameRate.toString()]}
						onChange={(e) => handleFrameRateChange(e.target.value)}
						isDisabled={disabled}
						className="w-full"
						aria-label="Frame rate selector"
						classNames={{
							trigger: "min-h-[44px]",
						}}
					>
						{FRAME_RATE_OPTIONS.map((option) => (
							<SelectItem key={option.value.toString()}>
								{option.label}
							</SelectItem>
						))}
					</Select>
					<div className="flex justify-between items-center text-xs sm:text-sm">
						<span className="text-default-500">Selected:</span>
						<span className="font-semibold text-foreground">
							{settings.frameRate} fps
						</span>
					</div>
					{showFrameRateWarning && (
						<div className="p-2 sm:p-3 rounded-lg bg-warning-50 dark:bg-warning-950/20 border border-warning-200 dark:border-warning-800">
							<p className="text-xs text-warning-600 dark:text-warning-400">
								⚠️ Selected frame rate ({settings.frameRate} fps) exceeds source
								video frame rate ({videoMetadata.frameRate} fps). This may not
								improve quality.
							</p>
						</div>
					)}
				</div>

				{/* Width Slider */}
				<div className="space-y-2 touch-manipulation">
					<Slider
						label="Width"
						minValue={100}
						maxValue={Math.min(videoMetadata.width, 1920)}
						value={settings.width}
						onChange={handleWidthChange}
						isDisabled={disabled}
						className="w-full"
						aria-label="Width slider"
						marks={(() => {
							const maxWidth = Math.min(videoMetadata.width, 1920);
							const marks = [{ value: 100, label: "100" }];

							// Add intermediate marks only if they're not too close to max
							if (maxWidth > 550 && 480 < maxWidth - 100) {
								marks.push({ value: 480, label: "480" });
							}
							if (maxWidth > 900 && 800 < maxWidth - 100) {
								marks.push({ value: 800, label: "800" });
							}
							if (maxWidth > 1380 && 1280 < maxWidth - 100) {
								marks.push({ value: 1280, label: "1280" });
							}

							// Always add the max width
							marks.push({ value: maxWidth, label: `${maxWidth}` });

							return marks;
						})()}
					/>
					<div className="flex justify-between items-center text-xs sm:text-sm min-h-[44px] sm:min-h-0">
						<span className="text-default-500">Dimensions:</span>
						<span className="font-semibold text-foreground">
							{settings.width} × {settings.height}px
						</span>
					</div>
				</div>
			</CardBody>
		</Card>
	);
};

// Performance: Memoize component to prevent unnecessary re-renders
export const ConversionControls = memo(ConversionControlsComponent);
