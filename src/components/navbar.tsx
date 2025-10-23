import { Button } from "@heroui/button";
import {
	Navbar as HeroUINavbar,
	NavbarBrand,
	NavbarContent,
	NavbarItem,
} from "@heroui/navbar";
import { ThemeSwitch } from "@/components/theme-switch";
import { siteConfig } from "@/config/site";

interface NavbarProps {
	onHelpClick?: () => void;
}

export const Navbar = ({ onHelpClick }: NavbarProps) => {
	return (
		<HeroUINavbar maxWidth="xl" position="sticky">
			<NavbarContent justify="start">
				<NavbarBrand className="gap-3">
					<div className="flex items-center justify-start gap-3">
						<img
							alt={`${siteConfig.name} logo`}
							className="h-8 w-8"
							src="/logo.png"
						/>
						<p className="font-bold text-inherit">{siteConfig.name}</p>
					</div>
				</NavbarBrand>
			</NavbarContent>

			<NavbarContent justify="end">
				<NavbarItem>
					<Button
						isIconOnly
						variant="light"
						onPress={onHelpClick}
						aria-label="Show keyboard shortcuts"
						className="text-default-500 transition-colors hover:text-primary-500"
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
								d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					</Button>
				</NavbarItem>
				<NavbarItem>
					<ThemeSwitch />
				</NavbarItem>
			</NavbarContent>
		</HeroUINavbar>
	);
};
