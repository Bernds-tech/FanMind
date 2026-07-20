import Link from "next/link";
import { renderSettingsAccountPage } from "../accountPages";

export default async function PackageSettingsPage() {
  const page = await renderSettingsAccountPage("package");
  return (
    <>
      {page}
      <Link
        href="/settings/subscription"
        style={{
          position: "fixed",
          right: 28,
          bottom: 28,
          zIndex: 40,
          borderRadius: 999,
          padding: "12px 18px",
          background: "#75e6dd",
          color: "#03111f",
          fontWeight: 800,
          textDecoration: "none",
          boxShadow: "0 10px 30px rgba(0,0,0,.25)",
        }}
      >
        Abo verwalten
      </Link>
    </>
  );
}
