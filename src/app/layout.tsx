import "./globals.css";

export const metadata = {
  title: "FanMind | Direct-to-Fan Plattform",
  description:
    "FanMind ist die europäische Direct-to-Fan-Plattform für Creator, Fans und digitale Fanclubs."
};

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{props.children}</body>
    </html>
  );
}
