import SiteNav from "@/components/SiteNav";
import { creatorPackages, fanMemberships } from "@/data/pricing";

export default function PricingPage() {
  return (
    <main>
      <div className="page-shell">
        <SiteNav active="Pricing" />

        <section>
          <div className="badge">FanMind Paket- und Preislogik</div>
          <h1>Pakete fuer Anbieter und Mitgliedschaften fuer Fans.</h1>
          <p className="lead">
            FanMind trennt klar zwischen Anbieter-Paketen und Fan-Mitgliedschaften. Die Preise sind Demo-Richtwerte fuer den MVP.
          </p>
        </section>

        <section className="section">
          <h2>Anbieter-Pakete</h2>
          <p className="lead">Diese Pakete beschreiben, was ein Anbieter auf FanMind nutzen kann.</p>
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
                <a className="button" href="/register">Demo starten</a>
              </article>
            ))}
          </div>
        </section>

        <section className="section">
          <h2>Fan-Mitgliedschaften</h2>
          <p className="lead">Diese Mitgliedschaften koennen Fans spaeter bei einem Anbieter kaufen.</p>
          <div className="grid">
            {fanMemberships.map((plan) => (
              <article className="card" key={plan.name}>
                <div className="badge">{plan.name}</div>
                <h2>{plan.price}</h2>
                <p>{plan.subtitle}</p>
                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <a className="button" href="/creator/demo">Demo ansehen</a>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
