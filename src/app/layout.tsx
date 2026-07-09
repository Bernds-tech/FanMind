import type { Metadata } from "next";
import { cookies } from "next/headers";
import { FANMIND_LOCALE_COOKIE, normalizeWorkspaceLocale } from "@/lib/workspaceLocale";
import { FANMIND_BRIGHTNESS_COOKIE, getThemeClass, normalizeFanMindBrightness } from "@/lib/userPreferences";
import { fanMindDescription, fanMindOgAlt, fanMindSiteUrl, fanMindTitle } from "./brandMetadata";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(fanMindSiteUrl),
  title: {
    default: fanMindTitle,
    template: "%s | FanMind",
  },
  description: fanMindDescription,
  applicationName: "FanMind",
  openGraph: {
    title: fanMindTitle,
    description: fanMindDescription,
    url: fanMindSiteUrl,
    siteName: "FanMind",
    type: "website",
    locale: "de_CH",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: fanMindOgAlt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: fanMindTitle,
    description: fanMindDescription,
    images: [
      {
        url: "/twitter-image",
        alt: fanMindOgAlt,
      },
    ],
  },
  icons: {
    icon: [{ url: "/icon", type: "image/png", sizes: "64x64" }],
    apple: [{ url: "/apple-icon", type: "image/png", sizes: "180x180" }],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = normalizeWorkspaceLocale(cookieStore.get(FANMIND_LOCALE_COOKIE)?.value);
  const brightness = normalizeFanMindBrightness(cookieStore.get(FANMIND_BRIGHTNESS_COOKIE)?.value);

  return (
    <html lang={locale} className={getThemeClass(brightness)} suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var b=localStorage.getItem("fanmind_brightness");var l=localStorage.getItem("fanmind_locale");if(l==="de"||l==="en")document.documentElement.lang=l;if(b==="standard"||b==="brighter"||b==="light"){document.documentElement.classList.remove("fanmind-theme-standard","fanmind-theme-brighter","fanmind-theme-light");document.documentElement.classList.add("fanmind-theme-"+b);}}catch(e){}`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
