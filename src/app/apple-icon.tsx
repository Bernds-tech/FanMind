import { ImageResponse } from "next/og";

import { FanMindBrowserIconMark } from "@/lib/fanmindBrowserIcon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<FanMindBrowserIconMark size={size.width} />, size);
}
