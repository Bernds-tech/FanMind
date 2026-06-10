"use client";

import Link from "next/link";
import { useActionState, useMemo, useState, type ChangeEvent } from "react";
import dashboardStyles from "../../dashboard/dashboard.module.css";
import fansStyles from "../fans.module.css";
import { importCsvContacts, type CsvImportActionState } from "../actions";
import { parseCsvContacts } from "./csv";
import styles from "./import.module.css";

const initialState: CsvImportActionState = {
  ok: false,
  message: "",
  importedCount: 0,
  skippedDuplicates: 0,
  skippedInvalid: 0,
};

export function CsvImportClient() {
  const [csvText, setCsvText] = useState("");
  const [previewRequested, setPreviewRequested] = useState(false);
  const [state, formAction, isPending] = useActionState(
    importCsvContacts,
    initialState,
  );
  const preview = useMemo(() => parseCsvContacts(csvText), [csvText]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const text = await file.text();
    setCsvText(text);
    setPreviewRequested(true);
  }

  return (
    <div className={styles.importStack}>
      <section className={dashboardStyles.moduleCard} aria-labelledby="csv-import-title">
        <div className={dashboardStyles.moduleHeader}>
          <div>
            <p className={dashboardStyles.eyebrow}>Manueller Kontaktimport</p>
            <h2 id="csv-import-title">CSV-Import</h2>
          </div>
          <Link className={dashboardStyles.secondaryButton} href="/fans#fans-list">
            Zur Fanliste
          </Link>
        </div>
        <p className={styles.explainer}>
          Importiere manuell exportierte oder vorbereitete Kontaktlisten. FanMind
          synchronisiert aktuell keine externen Plattformen.
        </p>

        <form className={styles.importForm} action={formAction}>
          <div className={fansStyles.fieldFull}>
            <label htmlFor="csv_text">CSV-Text</label>
            <textarea
              id="csv_text"
              name="csv_text"
              value={csvText}
              onChange={(event) => setCsvText(event.target.value)}
              placeholder={
                "display_name,handle,source_platform,language,status,tags,summary\nGerhard Müller,@gerhard,manual,de,new,VIP|Berlin,Interessiert an Sommer-Event"
              }
            />
            <p className={fansStyles.fieldHint}>
              Unterstützte Spalten: name/display_name, handle, platform/source_platform,
              language, status, tags, summary. Komma oder Semikolon wird automatisch erkannt.
            </p>
          </div>

          <div className={styles.fileRow}>
            <div className={fansStyles.fieldFull}>
              <label htmlFor="csv_file">CSV-Datei optional</label>
              <input
                id="csv_file"
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
              />
              <p className={fansStyles.fieldHint}>
                Die Datei wird nur im Browser ausgelesen und nicht hochgeladen oder in Storage gespeichert.
              </p>
            </div>
          </div>

          <div className={styles.actionRow}>
            <button
              type="button"
              className={dashboardStyles.secondaryButton}
              onClick={() => setPreviewRequested(true)}
            >
              Vorschau erstellen
            </button>
            <button
              type="submit"
              className={dashboardStyles.primaryButton}
              disabled={isPending || preview.contacts.length === 0}
            >
              {isPending ? "Import läuft ..." : "Kontakte importieren"}
            </button>
            <Link className={dashboardStyles.secondaryButton} href="/fans#fans-list">
              Zur Fanliste
            </Link>
          </div>
        </form>

        {state.message ? (
          <p className={state.ok ? styles.success : dashboardStyles.error} role="status">
            <strong>{state.ok ? "Import abgeschlossen" : "Import-Hinweis"}</strong>
            <span>{state.message}</span>
          </p>
        ) : null}
      </section>

      {previewRequested ? (
        <section className={dashboardStyles.moduleCard} aria-labelledby="csv-preview-title">
          <div className={dashboardStyles.moduleHeader}>
            <div>
              <p className={dashboardStyles.eyebrow}>Vorschau</p>
              <h2 id="csv-preview-title">Erkannte Kontakte</h2>
            </div>
            <span>
              {preview.contacts.length.toLocaleString("de-DE")} erkannt · Trennzeichen {preview.delimiter}
            </span>
          </div>

          {preview.errors.length ? (
            <div className={dashboardStyles.error} role="alert">
              <strong>CSV-Hinweise</strong>
              {preview.errors.map((error) => (
                <span key={error}>{error}</span>
              ))}
            </div>
          ) : null}

          {preview.contacts.length ? (
            <div className={dashboardStyles.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Handle</th>
                    <th>Quelle</th>
                    <th>Sprache</th>
                    <th>Status</th>
                    <th>Tags</th>
                    <th>Summary</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.contacts.map((contact, index) => (
                    <tr key={`${contact.displayName}-${contact.handle}-${index}`}>
                      <td>{contact.displayName}</td>
                      <td>{contact.handle || "—"}</td>
                      <td>{contact.sourcePlatform}</td>
                      <td>{contact.language}</td>
                      <td>{contact.status}</td>
                      <td>
                        {contact.tags.length ? contact.tags.join(", ") : "—"}
                      </td>
                      <td>{contact.summary || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={dashboardStyles.emptyState}>
              <strong>Noch keine Kontakte erkannt</strong>
              <p>Füge CSV-Text ein oder wähle eine .csv-Datei aus.</p>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
