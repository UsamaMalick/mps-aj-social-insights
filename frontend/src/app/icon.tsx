import { ImageResponse } from "next/og";

import { LogoMark } from "@/components/brand/logo-mark";
import { BRAND_COLORS } from "@/config/brand";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%" }}>
      <LogoMark size={size.width} tileColor={BRAND_COLORS.tile} bubbleColor={BRAND_COLORS.bubble} />
    </div>,
    size,
  );
}
