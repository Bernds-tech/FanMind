export const fanMindBrowserIconBrand = {
  canvas: "transparent",
  disc: "linear-gradient(145deg, #01040b 0%, #030819 54%, #07122a 100%)",
  ring: "rgba(226, 244, 255, 0.94)",
  ringAccent: "rgba(37, 181, 255, 0.78)",
  innerBorder: "rgba(255, 255, 255, 0.12)",
  fan: "#f8fdff",
  mind: "#1478ff",
  wordFan: "#f8fdff",
  wordMind: "#4aa3ff",
} as const;

type FanMindBrowserIconMarkProps = {
  size: number;
};

export function FanMindBrowserIconMark({ size }: FanMindBrowserIconMarkProps) {
  const discSize = Math.round(size * 0.9);
  const ringWidth = Math.max(1, Math.round(size * 0.024));
  const innerRingWidth = Math.max(1, Math.round(size * 0.012));
  const monogramSize = Math.round(size * 0.49);
  const wordmarkSize = Math.max(4, Math.round(size * 0.083));
  const wordmarkSpacing = Math.max(1, Math.round(size * 0.018));

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: fanMindBrowserIconBrand.canvas,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: `${discSize}px`,
          height: `${discSize}px`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          borderRadius: "999px",
          border: `${ringWidth}px solid ${fanMindBrowserIconBrand.ring}`,
          background: fanMindBrowserIconBrand.disc,
          boxShadow: `0 0 0 ${innerRingWidth}px ${fanMindBrowserIconBrand.ringAccent}, inset 0 0 0 ${innerRingWidth}px ${fanMindBrowserIconBrand.innerBorder}`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: `${Math.round(size * 0.055)}px`,
            lineHeight: 0.78,
            letterSpacing: `${Math.round(size * -0.045)}px`,
          }}
        >
          <span
            style={{
              color: fanMindBrowserIconBrand.fan,
              fontSize: `${monogramSize}px`,
              fontWeight: 950,
            }}
          >
            F
          </span>
          <span
            style={{
              color: fanMindBrowserIconBrand.mind,
              fontSize: `${monogramSize}px`,
              fontWeight: 950,
            }}
          >
            M
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: `${Math.round(size * 0.035)}px`,
            fontSize: `${wordmarkSize}px`,
            fontWeight: 900,
            letterSpacing: `${wordmarkSpacing}px`,
            lineHeight: 1,
          }}
        >
          <span style={{ color: fanMindBrowserIconBrand.wordFan }}>FAN</span>
          <span style={{ color: fanMindBrowserIconBrand.wordMind }}>MIND</span>
        </div>
      </div>
    </div>
  );
}
