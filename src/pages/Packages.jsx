import cameraBg from "./camerabg.png";

const packages = [
  {
    icon: "1️⃣",
    name: "Solo Package",
    people: "Good for 1 person",
    duration: "1 hour",
    description:
      "Perfect for individual portraits, personal photos, profile pictures, and solo sessions.",
    price: 400,
  },
  {
    icon: "2️⃣",
    name: "2-Gether Package",
    people: "Good for 2 people",
    duration: "1 hour",
    description:
      "A fun self-photography session for duos, couples, best friends, or partners.",
    price: 800,
  },
  {
    icon: "3️⃣",
    name: "Crew Package",
    people: "Good for 3–5 people",
    duration: "1 hour 30 minutes",
    description:
      "Perfect for small groups, families, barkadas, and special memories together.",
    price: 1500,
  },
  {
    icon: "4️⃣",
    name: "Multi Package",
    people: "Good for 6–8 people",
    duration: "1 hour 30 minutes",
    description:
      "Made for larger groups who want to capture fun and memorable moments together.",
    price: 2000,
  },
  {
    icon: "5️⃣",
    name: "Universal Package",
    people: "Good for 9–12 people",
    duration: "1 hour 30 minutes",
    description:
      "A spacious package for big groups, celebrations, and unforgettable group photos.",
    price: 2500,
  },
  
];

export default function Packages({ onSelectPackage }) {

  const scrollToPackages = () => {
    document
      .getElementById("packages-section")
      ?.scrollIntoView({
        behavior: "smooth",
      });
  };

  return (
    <div className="home-page">

      {/* 
          HERO
       */}

      <section className="hero-section">

        <div className="hero-content">

          <div className="hero-label">
            SELF PHOTOGRAPHY APPOINTMENT
          </div>

          <h1 className="hero-title">
            Your Moment.
            <br />
            Your Camera.
            <br />
            <span>Your Story.</span>
          </h1>

          <p className="hero-description">
            Capture your best moments your way. Choose a
            self-photography package, select your schedule,
            and enjoy your own creative photoshoot experience.
          </p>

          <button
            className="hero-button"
            onClick={scrollToPackages}
          >
            Explore Packages
            <span>→</span>
          </button>

        </div>

        {/* 
            HERO RIGHT VISUAL
        */}

        <div className="hero-visual">

          <div className="visual-decoration"></div>

          <div className="camera-card">

            <div className="camera-circle">
           <img
                         src={cameraBg}
                         alt="Camera"
                       />
            </div>

            <div className="camera-content">

              <div className="camera-small-label">
                CREATE YOUR
              </div>

              <h2>
                Own Your
                <br />
                Moment.
              </h2>

              <p>
                Your studio.
                <br />
                Your style.
                <br />
                Your story.
              </p>

            </div>

            <div className="camera-bottom">
              SELF STUDIO
            </div>

          </div>

        </div>

      </section>

      {/* 
          PACKAGES
       */}

      <section
        className="packages-section"
        id="packages-section"
      >

        <div className="packages-header">

          <div className="section-label">
            OUR PACKAGES
          </div>

          <h2>
            Choose Your Experience
          </h2>

          <p>
            Select a package that fits your group
            and start planning your photoshoot.
          </p>

        </div>

        <div className="packages-grid">

          {packages.map((pkg) => (

            <div
              className="package-card"
              key={pkg.name}
            >

              <div className="package-icon">
                {pkg.icon}
              </div>

              <div className="package-name">
                {pkg.name}
              </div>

              <div className="package-people">
                {pkg.people}
              </div>

              <div className="package-duration">
                ⏱️ {pkg.duration}
              </div>

              <p className="package-description">
                {pkg.description}
              </p>

              <div className="package-bottom">

                <div className="package-price">
                  ₱{pkg.price.toLocaleString()}
                </div>

                <button
                  className="package-button"
                  onClick={() =>
                    onSelectPackage({
                      ...pkg,
                      packageName: pkg.name,
                    })
                  }
                >
                  Choose Package
                  <span>→</span>
                </button>

              </div>

            </div>

          ))}

        </div>

      </section>

    </div>
  );
}