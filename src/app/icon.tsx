import { ImageResponse } from "next/og";

import { FanMindAppIconMark } from "@/lib/fanmindAppIcon";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<FanMindAppIconMark size={size.width} />, size);
}
