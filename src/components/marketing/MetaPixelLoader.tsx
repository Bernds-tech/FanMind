"use client";

import { useEffect, useMemo, useState } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import {
  buildMetaPixelBootstrap,
  normalizeMetaPixelId,
} from "@/lib/metaPixelPolicy.mjs";
import {
  grantMetaPixelConsent,
  markMetaPixelInitialized,
  setFanMindMarketingConsent,
  trackMetaPixelPageView,
} from "@/lib/metaPixel";

export function MetaPixelLoader({
  pixelId,
  hash,
}: {
  pixelId: string;
  hash: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const normalizedPixelId = normalizeMetaPixelId(pixelId);
  const bootstrap = useMemo(
    () => buildMetaPixelBootstrap(normalizedPixelId),
    [normalizedPixelId],
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!ready || !normalizedPixelId) return;
    trackMetaPixelPageView({ pathname, search, hash });
  }, [hash, normalizedPixelId, pathname, ready, search]);

  if (!normalizedPixelId || !bootstrap) return null;

  return (
    <Script
      id="fanmind-meta-pixel-bootstrap"
      strategy="afterInteractive"
      onReady={() => {
        setFanMindMarketingConsent("granted");
        if (!markMetaPixelInitialized(normalizedPixelId)) return;
        grantMetaPixelConsent();
        setReady(true);
      }}
    >
      {bootstrap}
    </Script>
  );
}
