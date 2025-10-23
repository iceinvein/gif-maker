import { Button } from "@heroui/button";
import {
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
} from "@heroui/modal";
import { motion } from "framer-motion";
import type { FC } from "react";

interface KeyboardShortcutsOverlayProps {
	isOpen: boolean;
	onClose: () => void;
}

interface ShortcutItem {
	keys: string[];
	description: string;
	category: string;
}

const shortcuts: ShortcutItem[] = [
	// Help
	{
		keys: ["?"],
		description: "Show/hide this help overlay",
		category: "General",
	},

	// Video playback
	{
		keys: ["Space"],
		description: "Play/Pause video",
		category: "Video Playback",
	},
	{
		keys: ["←"],
		description: "Move backward 1 second",
		category: "Video Playback",
	},
	{
		keys: ["→"],
		description: "Move forward 1 second",
		category: "Video Playback",
	},
	{
		keys: ["Shift", "←"],
		description: "Move backward 0.1 seconds (fine control)",
		category: "Video Playback",
	},
	{
		keys: ["Shift", "→"],
		description: "Move forward 0.1 seconds (fine control)",
		category: "Video Playback",
	},
	{
		keys: ["↑"],
		description: "Jump forward 5 seconds",
		category: "Video Playback",
	},
	{
		keys: ["↓"],
		description: "Jump backward 5 seconds",
		category: "Video Playback",
	},

	// Timeline editing
	{
		keys: ["I"],
		description: "Mark IN point (start) at current position",
		category: "Timeline Editing",
	},
	{
		keys: ["O"],
		description: "Mark OUT point (end) at current position",
		category: "Timeline Editing",
	},
];

const groupedShortcuts = shortcuts.reduce(
	(acc, shortcut) => {
		if (!acc[shortcut.category]) {
			acc[shortcut.category] = [];
		}
		acc[shortcut.category].push(shortcut);
		return acc;
	},
	{} as Record<string, ShortcutItem[]>,
);

const KeyBadge: FC<{ keyName: string }> = ({ keyName }) => (
	<kbd className="inline-block min-w-8 rounded border border-default-200 bg-default-100 px-2 py-1 text-center font-semibold text-foreground text-xs shadow-sm dark:border-default-700 dark:bg-default-800">
		{keyName}
	</kbd>
);

export const KeyboardShortcutsOverlay: FC<KeyboardShortcutsOverlayProps> = ({
	isOpen,
	onClose,
}) => {
	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			size="2xl"
			scrollBehavior="inside"
			backdrop="blur"
			classNames={{
				backdrop: "bg-background/50 backdrop-blur-md",
				base: "border border-divider/50",
			}}
		>
			<ModalContent>
				{(onClose) => (
					<>
						<ModalHeader className="flex flex-col gap-1 border-divider/50 border-b">
							<div className="flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30">
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
											d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
										/>
									</svg>
								</div>
								<div>
									<h2 className="font-bold text-xl">Keyboard Shortcuts</h2>
									<p className="font-normal text-default-500 text-sm">
										Master the GIF maker with these shortcuts
									</p>
								</div>
							</div>
						</ModalHeader>
						<ModalBody className="py-6">
							<div className="space-y-6">
								{Object.entries(groupedShortcuts).map(([category, items]) => (
									<motion.div
										key={category}
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ duration: 0.3 }}
									>
										<h3 className="mb-3 flex items-center gap-2 font-semibold text-primary-600 text-sm dark:text-primary-400">
											<div className="h-px flex-1 bg-linear-to-r from-primary-500/50 to-transparent" />
											<span>{category}</span>
											<div className="h-px flex-1 bg-linear-to-l from-primary-500/50 to-transparent" />
										</h3>
										<div className="space-y-2">
											{items.map((item) => (
												<div
													key={item.keys.join("-")}
													className="flex items-center justify-between gap-4 rounded-lg bg-content1 p-3 transition-colors hover:bg-content2"
												>
													<span className="flex-1 text-foreground text-sm">
														{item.description}
													</span>
													<div className="flex items-center gap-1">
														{item.keys.map((key, keyIndex) => (
															<span
																key={key}
																className="flex items-center gap-1"
															>
																<KeyBadge keyName={key} />
																{keyIndex < item.keys.length - 1 && (
																	<span className="mx-1 text-default-400 text-xs">
																		+
																	</span>
																)}
															</span>
														))}
													</div>
												</div>
											))}
										</div>
									</motion.div>
								))}

								{/* Pro Tips Section */}
								<motion.div
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.3, delay: 0.2 }}
									className="mt-8 rounded-xl border border-success-200/50 bg-linear-to-br from-success-50 to-primary-50 p-4 dark:border-success-800/50 dark:from-success-950/30 dark:to-primary-950/30"
								>
									<div className="flex items-start gap-3">
										<div className="shrink-0 text-success-600 dark:text-success-400">
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
													d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
												/>
											</svg>
										</div>
										<div className="flex-1">
											<h4 className="mb-2 font-semibold text-sm text-success-700 dark:text-success-400">
												Pro Tips
											</h4>
											<ul className="space-y-1 text-success-600 text-xs dark:text-success-500">
												<li>
													• Use <KeyBadge keyName="I" /> and{" "}
													<KeyBadge keyName="O" /> to quickly mark your clip
													boundaries
												</li>
												<li>
													• Hold <KeyBadge keyName="Shift" /> with arrow keys
													for frame-by-frame precision
												</li>
												<li>
													• All processing happens locally - your videos never
													leave your device
												</li>
												<li>
													• Lower quality settings = faster conversion and
													smaller file size
												</li>
											</ul>
										</div>
									</div>
								</motion.div>
							</div>
						</ModalBody>
						<ModalFooter className="border-divider/50 border-t">
							<Button
								color="primary"
								variant="flat"
								onPress={onClose}
								className="font-semibold"
							>
								Got it!
							</Button>
						</ModalFooter>
					</>
				)}
			</ModalContent>
		</Modal>
	);
};
