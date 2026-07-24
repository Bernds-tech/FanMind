from pathlib import Path

path = Path("scripts/operations/controlled-reboot-readiness-temp-20260724.mjs")
source = path.read_text(encoding="utf-8")
old = '''  const processes = runText("ps", ["-eo", "comm="])
    .split(/\\r?\\n/u)
    .map((value) => value.trim());
  const packageManagerBusy = processes.some((name) =>
    ["apt", "apt-get", "dpkg", "unattended-upgr"].includes(name),
  );
  await emit("PACKAGE_MANAGER_ACTIVITY", packageManagerBusy ? "busy" : "idle");
  requireCondition(!packageManagerBusy, "package_manager_busy");
'''
new = '''  const processes = runText("ps", ["-eo", "comm="])
    .split(/\\r?\\n/u)
    .map((value) => value.trim());
  const packageManagerProcessCount = processes.filter((name) =>
    ["apt", "apt-get", "dpkg", "unattended-upgr"].includes(name),
  ).length;

  runText("which", ["fuser"], { code: "fuser_missing" });
  const packageLocks = [
    "/var/lib/dpkg/lock-frontend",
    "/var/lib/dpkg/lock",
    "/var/lib/apt/lists/lock",
    "/var/cache/apt/archives/lock",
  ];
  const heldPackageLockCount = packageLocks.filter(
    (lockPath) =>
      sudoText(["fuser", lockPath], { allowFailure: true }) !== null,
  ).length;
  const aptDailyActive =
    runText(
      "systemctl",
      ["is-active", "--quiet", "apt-daily.service"],
      { allowFailure: true },
    ) !== null;
  const aptUpgradeActive =
    runText(
      "systemctl",
      ["is-active", "--quiet", "apt-daily-upgrade.service"],
      { allowFailure: true },
    ) !== null;
  const packageManagerBusy =
    heldPackageLockCount > 0 || aptDailyActive || aptUpgradeActive;
  await emit("PACKAGE_MANAGER_PROCESS_COUNT", packageManagerProcessCount);
  await emit("PACKAGE_MANAGER_HELD_LOCK_COUNT", heldPackageLockCount);
  await emit("APT_DAILY_ACTIVE", aptDailyActive ? "yes" : "no");
  await emit("APT_DAILY_UPGRADE_ACTIVE", aptUpgradeActive ? "yes" : "no");
  await emit("PACKAGE_MANAGER_ACTIVITY", packageManagerBusy ? "busy" : "idle");
  requireCondition(!packageManagerBusy, "package_manager_busy");
'''
if source.count(old) != 1:
    raise SystemExit(f"package_manager_anchor_count={source.count(old)}")
path.write_text(source.replace(old, new, 1), encoding="utf-8")
