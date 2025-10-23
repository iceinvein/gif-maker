import { Navbar } from "@/components/navbar";

interface DefaultLayoutProps {
	children: React.ReactNode;
	onHelpClick?: () => void;
}

export default function DefaultLayout({
	children,
	onHelpClick,
}: DefaultLayoutProps) {
	return (
		<div className="relative flex h-screen flex-col bg-background">
			<Navbar onHelpClick={onHelpClick} />
			<main className="grow">{children}</main>
		</div>
	);
}
