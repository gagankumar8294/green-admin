import "./globals.css";

export const metadata = {
  title: "Green World Standalone Admin Dashboard",
  description: "Standalone administrative console for managing products, inventory, orders, blogs, comments, settings, and analytics.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
