import "./globals.css";

export const metadata = {
  title: "FanMind",
  description: "Die europaeische Direct-to-Fan-Plattform fuer Creator, Fans und digitale Fanclubs."
};

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{props.children}</body>
    </html>
  );
}
