// Auth routing is handled by middleware — this layout just renders children.
export default function AuthGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
