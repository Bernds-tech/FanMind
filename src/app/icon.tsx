import { ImageResponse } from "next/og";

import { FanMindBrowserIconMark } from "@/lib/fanmindBrowserIcon";

export const size = { width: 96, height: 96 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<FanMindBrowserIconMark size={size.width} />, size);
}
