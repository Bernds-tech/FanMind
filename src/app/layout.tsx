import type { Metadata } from "next";
import { cookies } from "next/headers";
import { FANMIND_LOCALE_COOKIE, normalizeWorkspaceLocale } from "@/lib/workspaceLocale";
import { FANMIND_BRIGHTNESS_COOKIE, getThemeClass, normalizeFanMindBrightness } from "@/lib/userPreferences";
import "./globals.css";

export const metadata: Metadata = {
  title: "FanMind",
  description: "KI-CRM für Creator, Clubs, Events und Fan-Communities.",
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
