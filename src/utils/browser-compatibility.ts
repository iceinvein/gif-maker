/**
 * Browser compatibility checking utilities
 * Requirement 8.5: Display browser compatibility warnings for unsupported features
 */

export interface BrowserCompatibility {
	isCompatible: boolean;
	missingFeatures: string[];
}

/**
 * Check if the browser supports all required features for video conversion
 */
export function checkBrowserCompatibility(): BrowserCompatibility {
	const missingFeatures: string[] = [];

	// Check WebAssembly support
	if (typeof WebAssembly === "undefined") {
		missingFeatures.push("WebAssembly (required for video processing)");
	}

	// Check File API support
	if (typeof File === "undefined" || typeof FileReader === "undefined") {
		missingFeatures.push("File API (required for file handling)");
	}

	// Check Blob support
	if (typeof Blob === "undefined") {
		missingFeatures.push("Blob API (required for file downloads)");
	}

	// Check Web Workers support
	if (typeof Worker === "undefined") {
		missingFeatures.push("Web Workers (required for background processing)");
	}

	// Check SharedArrayBuffer support (optional but recommended for FFmpeg)
	// Note: This is optional as FFmpeg can work without it, but with reduced performance
	if (typeof SharedArrayBuffer === "undefined") {
		// Don't add to missing features as it's optional
		console.warn(
			"SharedArrayBuffer is not available. Video conversion may be slower.",
		);
	}

	// Check if browser supports ES2020 features
	try {
		// Test for optional chaining
		const test = { a: { b: 1 } };
		const result = test?.a?.b;
		if (result !== 1) {
			missingFeatures.push("ES2020 features (modern JavaScript support)");
		}
	} catch {
		missingFeatures.push("ES2020 features (modern JavaScript support)");
	}

	return {
		isCompatible: missingFeatures.length === 0,
		missingFeatures,
	};
}

/**
 * Get browser name and version
 */
export function getBrowserInfo(): {
	name: string;
	version: string;
	isSupported: boolean;
} {
	const userAgent = navigator.userAgent;
	let name = "Unknown";
	let version = "Unknown";
	let isSupported = false;

	// Chrome/Edge (Chromium)
	if (userAgent.includes("Chrome")) {
		name = userAgent.includes("Edg") ? "Edge" : "Chrome";
		const match = userAgent.match(/Chrome\/(\d+)/);
		version = match ? match[1] : "Unknown";
		isSupported = match ? Number.parseInt(match[1], 10) >= 90 : false;
	}
	// Firefox
	else if (userAgent.includes("Firefox")) {
		name = "Firefox";
		const match = userAgent.match(/Firefox\/(\d+)/);
		version = match ? match[1] : "Unknown";
		isSupported = match ? Number.parseInt(match[1], 10) >= 88 : false;
	}
	// Safari
	else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
		name = "Safari";
		const match = userAgent.match(/Version\/(\d+)/);
		version = match ? match[1] : "Unknown";
		isSupported = match ? Number.parseInt(match[1], 10) >= 15 : false;
	}

	return { name, version, isSupported };
}

/**
 * Check if the file size is within acceptable limits
 */
export function checkFileSize(fileSize: number): {
	isValid: boolean;
	isLarge: boolean;
	message?: string;
} {
	const MAX_SIZE = 500 * 1024 * 1024; // 500MB
	const WARNING_SIZE = 200 * 1024 * 1024; // 200MB

	if (fileSize > MAX_SIZE) {
		return {
			isValid: false,
			isLarge: true,
			message: `File size exceeds the maximum limit of ${MAX_SIZE / (1024 * 1024)}MB. Please choose a smaller file.`,
		};
	}

	if (fileSize > WARNING_SIZE) {
		return {
			isValid: true,
			isLarge: true,
			message: `This file is large (${(fileSize / (1024 * 1024)).toFixed(2)}MB) and may take longer to process.`,
		};
	}

	return {
		isValid: true,
		isLarge: false,
	};
}
