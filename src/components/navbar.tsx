import {
	Navbar as HeroUINavbar,
	NavbarBrand,
	NavbarContent,
} from "@heroui/navbar";
import { ThemeSwitch } from "@/components/theme-switch";
import { siteConfig } from "@/config/site";

export const Navbar = () => {
	return (
		<HeroUINavbar maxWidth="xl" position="sticky">
			<NavbarContent justify="start">
				<NavbarBrand className="gap-3">
					<div className="flex justify-start items-center gap-3">
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
				<ThemeSwitch />
			</NavbarContent>
		</HeroUINavbar>
	);
};
