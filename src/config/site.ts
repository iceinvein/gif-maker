export type SiteConfig = typeof siteConfig;

export const siteConfig = {
	name: "Video to GIF",
	description:
		"Convert your videos to high-quality GIF animations right in your browser",
	navItems: [
		{
			label: "Home",
			href: "/",
		},
		{
			label: "Converter",
			href: "/converter",
		},
	],
	navMenuItems: [
		{
			label: "Home",
			href: "/",
		},
		{
			label: "Converter",
			href: "/converter",
		},
	],
	links: {
		github: "https://github.com",
	},
};
