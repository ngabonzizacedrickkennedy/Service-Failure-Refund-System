// Auth-gated app — render on demand instead of prerendering at build time.
export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}