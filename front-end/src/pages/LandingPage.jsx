import { Link } from "react-router-dom";

function LandingPage() {
  return (
    <section className="landing-page">
      <div className="landing-hero">
        <div className="landing-hero-content">
          <p className="landing-eyebrow">Find your Dream Property NOW</p>

          <h1>Search for and rate Australian properties</h1>

          <p className="landing-intro">
            Use Dream Property 4 U to explore rental listings, view detailed
            property information and provide ratings.
          </p>

          <div className="landing-actions">
            <Link className="btn btn-primary" to="/search">
              Search Dreams
            </Link>

            <Link className="btn btn-outline-secondary" to="/register">
              Create Account
            </Link>
          </div>
        </div>
      </div>

      <div className="landing-feature-grid">
        <article className="landing-feature-card">
          <h2>Search Properties</h2>
          <p>
            Filter rental data using practical search controls and browse
            results in a clear table layout.
          </p>
        </article>

        <article className="landing-feature-card">
          <h2>Review Details</h2>
          <p>
            Each property contains detailed information to help you make your decision.
          </p>
        </article>

        <article className="landing-feature-card">
          <h2>Rate Rentals</h2>
          <p>
            Register with us to rate the properties we have available. 
          </p>
        </article>
      </div>
    </section>
  );
}

export default LandingPage;