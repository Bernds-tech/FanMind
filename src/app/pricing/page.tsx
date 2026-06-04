import SiteNav from "@/components/SiteNav";
import { creatorPackages, fanMemberships, pricingNotice } from "@/data/pricing";

export default function PricingPage() {
  return (
    <main>
      <div className="page-shell">
        <SiteNav active="Pricing" />

        <section>
          <div className="badge">FanMind Preise fuer Agenturen</div>
          <h1>Pakete fuer betreute Profile, Fan-Gedaechtnis und bessere Nachfass-Arbeit.</h1>
          <p className="lead">
            FanMind startet als unterstuetzender Assistent fuer Agenturen und Teams, die mehrere Profile betreuen und Fan-Gespraeche strukturierter verwalten wollen.
          </p>
        </section>

        <section className="section hero-card">
          <div className="badge">Wichtiger Hinweis</div>
          <h2>Mensch bleibt Entscheider.</h2>
          <p className="lead">{pricingNotice}</p>
        </section>

        <section className="section">
          <h2>FanMind Pakete</h2>
          <p className="lead">Diese Pakete richten sich an Agenturen, Teams und Organisationen mit betreuten Profilen.</p>
          <div className="grid">
            {creatorPackages.map((plan) => (
              <article className="card" key={plan.name}>
                <div className="badge">{plan.name}</div>
                <h2>{plan.price}</h2>
                <p>{plan.subtitle}</p>
                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <a className="button" href="/register">Pilot anfragen</a>
              </article>
            ))}
          </div>
        </section>

        <section className="section">
          <h2>Wie FanMind arbeitet</h2>
          <p className="lead">Zum Start geht es nicht um automatisches Senden, sondern um bessere Vorbereitung, Uebersicht und Kontrolle.</p>
          <div className="grid">
            {fanMemberships.map((plan) => (
              <article className="card" key={plan.name}>
                <div className="badge">Prinzip</div>
                <h3>{plan.name}</h3>
                <h2>{plan.price}</h2>
                <p>{plan.subtitle}</p>
                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <a className="button" href="/demo">Demo ansehen</a>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
