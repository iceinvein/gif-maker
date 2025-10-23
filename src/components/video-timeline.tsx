import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";
import { AnimatePresence, motion } from "framer-motion";
import { type FC, memo, useCallback, useEffect, useState } from "react";

interface VideoTimelineProps {
	duration: number; // Total video duration in seconds
	startTime: number; // Selected start time in seconds
	endTime: number; // Selected end time in seconds
	currentTime?: number; // Current playback position in seconds
	onTimeRangeChange: (startTime: number, endTime: number) => void;
	onSeek?: (time: number) => void;
	disabled?: boolean;
}

const formatTime = (seconds: number): string => {
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	const ms = Math.floor((seconds % 1) * 100);
	return `${mins}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
};

const parseTime = (timeStr: string): number | null => {
	// Parse format: MM:SS.MS or MM:SS or SS
	const parts = timeStr.split(":");
	let totalSeconds = 0;

	if (parts.length === 2) {
		// MM:SS.MS or MM:SS
		const mins = Number.parseInt(parts[0], 10);
		const secsParts = parts[1].split(".");
		const secs = Number.parseInt(secsParts[0], 10);
		const ms = secsParts[1] ? Number.parseInt(secsParts[1], 10) / 100 : 0;

		if (Number.isNaN(mins) || Number.isNaN(secs)) return null;
		totalSeconds = mins * 60 + secs + ms;
	} else if (parts.length === 1) {
		// SS or SS.MS
		const secsParts = parts[0].split(".");
		const secs = Number.parseInt(secsParts[0], 10);
		const ms = secsParts[1] ? Number.parseInt(secsParts[1], 10) / 100 : 0;

		if (Number.isNaN(secs)) return null;
		totalSeconds = secs + ms;
	} else {
		return null;
	}

	return totalSeconds;
};

const VideoTimelineComponent: FC<VideoTimelineProps> = ({
	duration,
	startTime,
	endTime,
	currentTime = 0,
	onTimeRangeChange,
	onSeek,
	disabled = false,
}) => {
	const [localStartTime, setLocalStartTime] = useState(startTime);
	const [localEndTime, setLocalEndTime] = useState(endTime);
	const [startTimeInput, setStartTimeInput] = useState(formatTime(startTime));
	const [endTimeInput, setEndTimeInput] = useState(formatTime(endTime));
	const [showShortcuts, setShowShortcuts] = useState(false);

	// Update local state when props change
	useEffect(() => {
		setLocalStartTime(startTime);
		setLocalEndTime(endTime);
		setStartTimeInput(formatTime(startTime));
		setEndTimeInput(formatTime(endTime));
	}, [startTime, endTime]);

	// Mark IN point at current playback position
	const handleMarkIn = useCallback(() => {
		if (disabled || currentTime === undefined || !Number.isFinite(currentTime))
			return;

		const newStartTime = Math.max(0, Math.min(currentTime, localEndTime - 0.1));
		if (Number.isFinite(newStartTime)) {
			setLocalStartTime(newStartTime);
			setStartTimeInput(formatTime(newStartTime));
			onTimeRangeChange(newStartTime, localEndTime);
		}
	}, [disabled, currentTime, localEndTime, onTimeRangeChange]);

	// Mark OUT point at current playback position
	const handleMarkOut = useCallback(() => {
		if (disabled || currentTime === undefined || !Number.isFinite(currentTime))
			return;

		const newEndTime = Math.min(
			duration,
			Math.max(currentTime, localStartTime + 0.1),
		);
		if (Number.isFinite(newEndTime)) {
			setLocalEndTime(newEndTime);
			setEndTimeInput(formatTime(newEndTime));
			onTimeRangeChange(localStartTime, newEndTime);
		}
	}, [disabled, currentTime, duration, localStartTime, onTimeRangeChange]);

	const handleStartTimeInputChange = useCallback((value: string) => {
		setStartTimeInput(value);
	}, []);

	const handleEndTimeInputChange = useCallback((value: string) => {
		setEndTimeInput(value);
	}, []);

	const handleStartTimeInputBlur = useCallback(() => {
		const parsed = parseTime(startTimeInput);
		if (parsed !== null && parsed >= 0 && parsed < localEndTime) {
			const clampedStart = Math.min(parsed, duration);
			setLocalStartTime(clampedStart);
			setStartTimeInput(formatTime(clampedStart));
			onTimeRangeChange(clampedStart, localEndTime);
		} else {
			// Reset to current value if invalid
			setStartTimeInput(formatTime(localStartTime));
		}
	}, [
		startTimeInput,
		localEndTime,
		localStartTime,
		duration,
		onTimeRangeChange,
	]);

	const handleEndTimeInputBlur = useCallback(() => {
		const parsed = parseTime(endTimeInput);
		if (parsed !== null && parsed > localStartTime && parsed <= duration) {
			setLocalEndTime(parsed);
			setEndTimeInput(formatTime(parsed));
			onTimeRangeChange(localStartTime, parsed);
		} else {
			// Reset to current value if invalid
			setEndTimeInput(formatTime(localEndTime));
		}
	}, [endTimeInput, localStartTime, localEndTime, duration, onTimeRangeChange]);

	const handleTimelineClick = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			if (disabled || !onSeek || !duration || duration <= 0) return;

			const rect = e.currentTarget.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const percentage = x / rect.width;
			const seekTime = percentage * duration;

			const clampedTime = Math.max(0, Math.min(seekTime, duration));
			if (Number.isFinite(clampedTime)) {
				onSeek(clampedTime);
			}
		},
		[disabled, duration, onSeek],
	);

	const selectedDuration = localEndTime - localStartTime;
	const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

	// Keyboard shortcuts
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Don't trigger if user is typing in an input field
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement
			) {
				return;
			}

			if (disabled) return;

			switch (e.key.toLowerCase()) {
				case "i":
					e.preventDefault();
					handleMarkIn();
					break;
				case "o":
					e.preventDefault();
					handleMarkOut();
					break;
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [disabled, handleMarkIn, handleMarkOut]);

	return (
		<Card className="w-full">
			<CardBody className="space-y-4 p-4">
				{/* Timeline Header */}
				<div className="flex items-center justify-between">
					<h3 className="font-semibold text-foreground text-lg">
						Video Timeline
					</h3>
					<div className="text-default-500 text-sm">
						Selected: {formatTime(selectedDuration)} / {formatTime(duration)}
					</div>
				</div>

				{/* Visual Timeline */}
				<div
					className="relative h-20 w-full cursor-pointer overflow-hidden bg-default-100 dark:bg-default-800"
					onClick={handleTimelineClick}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							handleTimelineClick(
								e as unknown as React.MouseEvent<HTMLDivElement>,
							);
						}
					}}
					role="button"
					tabIndex={disabled ? -1 : 0}
					aria-label="Timeline scrubber"
				>
					{/* Selected Range Highlight */}
					<div
						className="absolute top-0 bottom-0 bg-primary-200 dark:bg-primary-900/40"
						style={{
							left: `${(localStartTime / duration) * 100}%`,
							right: `${100 - (localEndTime / duration) * 100}%`,
						}}
					/>

					{/* IN Marker */}
					<div
						className="absolute top-0 bottom-0 z-20 w-1 bg-success-500"
						style={{
							left: `${(localStartTime / duration) * 100}%`,
						}}
					>
						<div className="-top-1 absolute left-0 rounded bg-success-500 px-1 font-bold text-white text-xs">
							IN
						</div>
					</div>

					{/* OUT Marker */}
					<div
						className="absolute top-0 bottom-0 z-20 w-1 bg-warning-500"
						style={{
							left: `${(localEndTime / duration) * 99.7}%`,
						}}
					>
						<div className="-top-1 absolute right-0 rounded bg-warning-500 px-1 font-bold text-white text-xs">
							OUT
						</div>
					</div>

					{/* Playhead Indicator */}
					{currentTime !== undefined && (
						<div
							className="absolute top-0 bottom-0 z-30 w-0.5 bg-danger-500 transition-all duration-100"
							style={{
								left: `${progressPercentage}%`,
							}}
						>
							<div className="-top-1 -translate-x-1/2 absolute left-1/2 h-3 w-3 rounded-full bg-danger-500" />
						</div>
					)}

					{/* Time Markers */}
					<div className="pointer-events-none absolute inset-0 flex items-center justify-between px-2 text-default-400 text-xs">
						<span>0:00</span>
						<span>{formatTime(duration / 2)}</span>
						<span>{formatTime(duration)}</span>
					</div>
				</div>

				{/* Mark IN/OUT Buttons */}
				<div className="flex gap-3">
					<Button
						color="success"
						variant="flat"
						onPress={handleMarkIn}
						isDisabled={disabled || currentTime === undefined}
						className="flex-1"
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
									d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
								/>
							</svg>
						}
					>
						Mark IN (I)
					</Button>
					<Button
						color="warning"
						variant="flat"
						onPress={handleMarkOut}
						isDisabled={disabled || currentTime === undefined}
						className="flex-1"
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
									d="M13 5l7 7-7 7M5 5l7 7-7 7"
								/>
							</svg>
						}
					>
						Mark OUT (O)
					</Button>
				</div>

				{/* Time Inputs */}
				<div className="grid grid-cols-2 gap-4">
					<Input
						label="Start Time"
						placeholder="0:00.00"
						value={startTimeInput}
						onValueChange={handleStartTimeInputChange}
						onBlur={handleStartTimeInputBlur}
						isDisabled={disabled}
						size="sm"
						description="Format: MM:SS.MS"
						classNames={{
							input: "font-mono",
						}}
					/>
					<Input
						label="End Time"
						placeholder="0:00.00"
						value={endTimeInput}
						onValueChange={handleEndTimeInputChange}
						onBlur={handleEndTimeInputBlur}
						isDisabled={disabled}
						size="sm"
						description="Format: MM:SS.MS"
						classNames={{
							input: "font-mono",
						}}
					/>
				</div>

				{/* Keyboard Shortcuts Help - Collapsible */}
				<div className="space-y-2">
					<button
						type="button"
						onClick={() => setShowShortcuts(!showShortcuts)}
						className="flex w-full items-center justify-between rounded-lg p-2 text-default-600 text-xs transition-colors hover:bg-default-100 dark:text-default-400 dark:hover:bg-default-800"
					>
						<div className="flex items-center gap-2">
							<svg
								className="h-4 w-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
								/>
							</svg>
							<span className="font-medium">Keyboard Shortcuts</span>
						</div>
						<motion.svg
							animate={{ rotate: showShortcuts ? 180 : 0 }}
							transition={{ duration: 0.2 }}
							className="h-4 w-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M19 9l-7 7-7-7"
							/>
						</motion.svg>
					</button>

					<AnimatePresence>
						{showShortcuts && (
							<motion.div
								initial={{ height: 0, opacity: 0 }}
								animate={{ height: "auto", opacity: 1 }}
								exit={{ height: 0, opacity: 0 }}
								transition={{ duration: 0.2 }}
								className="overflow-hidden"
							>
								<div className="flex flex-wrap items-center gap-3 rounded-lg bg-default-50 p-3 text-default-600 text-xs dark:bg-default-900/30 dark:text-default-400">
									<div className="flex items-center gap-2">
										<kbd className="rounded bg-default-200 px-2 py-1 font-mono font-semibold text-[10px] dark:bg-default-700">
											I
										</kbd>
										<span>Mark IN</span>
									</div>
									<div className="flex items-center gap-2">
										<kbd className="rounded bg-default-200 px-2 py-1 font-mono font-semibold text-[10px] dark:bg-default-700">
											O
										</kbd>
										<span>Mark OUT</span>
									</div>
									<div className="flex items-center gap-2">
										<kbd className="rounded bg-default-200 px-2 py-1 font-mono font-semibold text-[10px] dark:bg-default-700">
											Space
										</kbd>
										<span>Play/Pause</span>
									</div>
									<div className="flex items-center gap-2">
										<kbd className="rounded bg-default-200 px-2 py-1 font-mono font-semibold text-[10px] dark:bg-default-700">
											←/→
										</kbd>
										<span>±1s</span>
									</div>
									<div className="flex items-center gap-2">
										<kbd className="rounded bg-default-200 px-2 py-1 font-mono font-semibold text-[10px] dark:bg-default-700">
											Shift+←/→
										</kbd>
										<span>±0.1s</span>
									</div>
									<div className="flex items-center gap-2">
										<kbd className="rounded bg-default-200 px-2 py-1 font-mono font-semibold text-[10px] dark:bg-default-700">
											↑/↓
										</kbd>
										<span>±5s</span>
									</div>
								</div>
							</motion.div>
						)}
					</AnimatePresence>

					<button
						type="button"
						onClick={() => {
							setLocalStartTime(0);
							setLocalEndTime(duration);
							setStartTimeInput(formatTime(0));
							setEndTimeInput(formatTime(duration));
							onTimeRangeChange(0, duration);
						}}
						disabled={disabled}
						className="w-full rounded-lg bg-default-100 px-3 py-2 font-medium text-default-700 text-xs transition-colors hover:bg-default-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-default-800 dark:text-default-300 dark:hover:bg-default-700"
					>
						Reset to Full Duration
					</button>
				</div>
			</CardBody>
		</Card>
	);
};

export const VideoTimeline = memo(VideoTimelineComponent);
