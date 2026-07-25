from pathlib import Path


def replace_once(path: Path, old: str, new: str, label: str) -> None:
    source = path.read_text(encoding="utf-8")
    count = source.count(old)
    if count != 1:
        raise SystemExit(f"{label}_anchor_count_{count}")
    path.write_text(source.replace(old, new, 1), encoding="utf-8")


sidebar_path = Path("src/components/WorkspaceSidebar.module.css")
dashboard_path = Path("src/app/dashboard/dashboard.module.css")

old_background = """  background:
    var(
      --fanmind-shell-sidebar,
      linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(2, 6, 23, 0.96))
    ),
    #020617;
"""
new_background = """  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.995), rgba(2, 6, 23, 0.99)),
    #020617;
"""
replace_once(sidebar_path, old_background, new_background, "sidebar_background")

sidebar_source = sidebar_path.read_text(encoding="utf-8")
responsive_marker = "/* Fixed vertical rail on narrow web viewports. */"
if responsive_marker in sidebar_source:
    raise SystemExit("sidebar_responsive_contract_already_present")
responsive_contract = """
/* Fixed vertical rail on narrow web viewports. */
@media (max-width: 960px) {
  .sidebar {
    --sidebar-width: min(320px, calc(100vw - 48px));
  }
}

@media (max-width: 520px) {
  .sidebar {
    --sidebar-width: min(320px, calc(100vw - 32px));
  }
}

"""
anchor = "@media (max-height: 760px) {"
if sidebar_source.count(anchor) != 1:
    raise SystemExit("sidebar_height_media_anchor_invalid")
sidebar_path.write_text(
    sidebar_source.replace(anchor, responsive_contract + anchor, 1),
    encoding="utf-8",
)

dashboard_source = dashboard_path.read_text(encoding="utf-8")
dashboard_marker = "/* Fixed WorkspaceSidebar overlay/rail contract on narrow viewports. */"
if dashboard_marker in dashboard_source:
    raise SystemExit("dashboard_responsive_contract_already_present")
dashboard_contract = """

/* Fixed WorkspaceSidebar overlay/rail contract on narrow viewports. */
@media (max-width: 960px) {
  .dashboardShell {
    grid-template-columns: 0 minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr);
  }

  .dashboardShellCollapsed {
    grid-template-columns: 76px minmax(0, 1fr);
  }

  .dashboardContent {
    grid-column: 2;
    min-width: 0;
  }
}
"""
dashboard_path.write_text(dashboard_source.rstrip() + dashboard_contract + "\n", encoding="utf-8")

print("SIDEBAR_RESPONSIVE_PATCH=success")
