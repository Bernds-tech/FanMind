type AppTopbarProps = {
  title: string;
  subtitle: string;
  searchId: string;
  searchPlaceholder: string;
};

export function AppTopbar({ title, subtitle, searchId, searchPlaceholder }: AppTopbarProps) {
  return (
    <header className="workspace-topbar">
      <div className="topbar-title-block">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <label className="search-field topbar-search" htmlFor={searchId}>
        <span>Suche</span>
        <input id={searchId} type="search" placeholder={searchPlaceholder} />
      </label>
      <div className="toolbar-actions" aria-label="Kontaktaktionen">
        <button type="button" className="button compact">Filter</button>
        <button type="button" className="button compact">Sortierung</button>
        <button type="button" className="button compact">Ansichten</button>
        <button type="button" className="button compact primary">Neuer Kontakt</button>
      </div>
    </header>
  );
}
