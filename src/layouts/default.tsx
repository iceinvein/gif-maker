import { Navbar } from "@/components/navbar";

export default function DefaultLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="relative flex flex-col h-screen bg-background">
			<Navbar />
			<main className="flex-grow">{children}</main>
		</div>
	);
}
