import { useEffect, useMemo, useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const CATEGORIES = [
  "All",
  "Video Editing",
  "Graphic Design",
  "Web Development",
  "UI/UX Design",
  "Content Writing",
  "Photography",
  "Marketing",
  "Music & Audio",
];

const CATEGORY_META = {
  "Video Editing": { icon: "▶", accent: "orange" },
  "Graphic Design": { icon: "✦", accent: "blue" },
  "Web Development": { icon: "</>", accent: "green" },
  "UI/UX Design": { icon: "◈", accent: "yellow" },
  "Content Writing": { icon: "Aa", accent: "pink" },
  Photography: { icon: "◉", accent: "purple" },
  Marketing: { icon: "↗", accent: "red" },
  "Music & Audio": { icon: "♫", accent: "cyan" },
};

function getCategoryMeta(category) {
  return (
    CATEGORY_META[category] || {
      icon: "✦",
      accent: "orange",
    }
  );
}

function formatRate(rate) {
  return `₹${Number(rate || 0).toLocaleString("en-IN")}`;
}

function formatDate(date) {
  if (!date) return "Recently";
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return "Recently";

  return value.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        `Request failed with status ${response.status}`
    );
  }

  return data;
}

export default function App() {
  const [page, setPage] = useState("marketplace");
  const [gigs, setGigs] = useState([]);
  const [clientBookings, setClientBookings] = useState([]);
  const [creatorBookings, setCreatorBookings] = useState([]);

  const [loadingGigs, setLoadingGigs] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [loadingCreator, setLoadingCreator] = useState(false);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [bookingGig, setBookingGig] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadGigs();
  }, []);

  useEffect(() => {
    if (page === "bookings") {
      loadClientBookings();
    }

    if (page === "dashboard") {
      loadCreatorBookings();
    }
  }, [page]);

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  async function loadGigs() {
    try {
      setLoadingGigs(true);

      const data = await apiRequest("/gigs");

      const list = Array.isArray(data)
        ? data
        : data?.gigs || data?.data || [];

      setGigs(list);
    } catch (error) {
      showToast(error.message || "Could not load gigs", "error");
    } finally {
      setLoadingGigs(false);
    }
  }

  async function loadClientBookings() {
    try {
      setLoadingBookings(true);

      const data = await apiRequest("/bookings/client");

      const list = Array.isArray(data)
        ? data
        : data?.bookings || data?.data || [];

      setClientBookings(list);
    } catch (error) {
      showToast(error.message || "Could not load bookings", "error");
    } finally {
      setLoadingBookings(false);
    }
  }

  async function loadCreatorBookings() {
    try {
      setLoadingCreator(true);

      const data = await apiRequest("/bookings/creator");

      const list = Array.isArray(data)
        ? data
        : data?.bookings || data?.data || [];

      setCreatorBookings(list);
    } catch (error) {
      showToast(error.message || "Could not load creator requests", "error");
    } finally {
      setLoadingCreator(false);
    }
  }

  function showToast(message, type = "success") {
    setToast({ message, type });
  }

  function navigate(target) {
    setPage(target);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function createGig(payload) {
    try {
      await apiRequest("/gigs", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      await loadGigs();
      showToast("Your gig is live on SkillSwap.");
      navigate("marketplace");
    } catch (error) {
      showToast(error.message || "Could not publish gig", "error");
      throw error;
    }
  }

  async function createBooking(payload) {
    try {
      await apiRequest("/bookings", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setBookingSuccess(true);
      await loadClientBookings();
    } catch (error) {
      showToast(error.message || "Could not create booking", "error");
      throw error;
    }
  }

  async function updateBooking(id, action) {
    try {
      await apiRequest(`/bookings/${id}/${action}`, {
        method: "PATCH",
      });

      await loadCreatorBookings();

      showToast(
        action === "accept"
          ? "Booking accepted successfully."
          : "Booking declined."
      );
    } catch (error) {
      showToast(
        error.message ||
          "This booking could not be updated. Another pending booking may already exist.",
        "error"
      );
    }
  }

  return (
    <div className="app-shell">
      <Background />

      <Navbar page={page} navigate={navigate} />

      <main>
        {page === "marketplace" && (
          <Marketplace
            gigs={gigs}
            loading={loadingGigs}
            search={search}
            setSearch={setSearch}
            category={category}
            setCategory={setCategory}
            onBook={setBookingGig}
            navigate={navigate}
            onRefresh={loadGigs}
          />
        )}

        {page === "post" && (
          <PostGig onSubmit={createGig} navigate={navigate} />
        )}

        {page === "bookings" && (
          <MyBookings
            bookings={clientBookings}
            loading={loadingBookings}
            navigate={navigate}
            onRefresh={loadClientBookings}
          />
        )}

        {page === "dashboard" && (
          <CreatorDashboard
            bookings={creatorBookings}
            loading={loadingCreator}
            onAction={updateBooking}
            onRefresh={loadCreatorBookings}
          />
        )}
      </main>

      <Footer navigate={navigate} />

      {bookingGig && (
        <BookingModal
          gig={bookingGig}
          success={bookingSuccess}
          onClose={() => {
            setBookingGig(null);
            setBookingSuccess(false);
          }}
          onSubmit={createBooking}
          onViewBookings={() => {
            setBookingGig(null);
            setBookingSuccess(false);
            navigate("bookings");
          }}
        />
      )}

      {toast && <Toast toast={toast} />}
    </div>
  );
}

function Background() {
  return (
    <div className="background-layer" aria-hidden="true">
      <div className="bg-grid" />
      <div className="bg-orb bg-orb-one" />
      <div className="bg-orb bg-orb-two" />
      <div className="bg-noise" />
    </div>
  );
}

function Navbar({ page, navigate }) {
  return (
    <header className="navbar">
      <div className="nav-inner">
        <button className="brand" onClick={() => navigate("marketplace")}>
          <span className="brand-mark">
            <span />
            <span />
          </span>

          <span className="brand-copy">
            <strong>Skill</strong>
            <em>Swap</em>
          </span>
        </button>

        <nav className="desktop-nav">
          <button
            className={page === "marketplace" ? "active" : ""}
            onClick={() => navigate("marketplace")}
          >
            Explore
          </button>

          <button
            className={page === "post" ? "active" : ""}
            onClick={() => navigate("post")}
          >
            Post a gig
          </button>

          <button
            className={page === "bookings" ? "active" : ""}
            onClick={() => navigate("bookings")}
          >
            My bookings
          </button>

          <button
            className={page === "dashboard" ? "active" : ""}
            onClick={() => navigate("dashboard")}
          >
            Creator dashboard
          </button>
        </nav>

        <button
          className="nav-cta"
          onClick={() => navigate("post")}
        >
          Start earning
          <span>↗</span>
        </button>
      </div>
    </header>
  );
}

function Marketplace({
  gigs,
  loading,
  search,
  setSearch,
  category,
  setCategory,
  onBook,
  navigate,
  onRefresh,
}) {
  const filteredGigs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...gigs]
      .filter((gig) => {
        const matchesCategory =
          category === "All" || gig.category === category;

        if (!query) return matchesCategory;

        return (
          matchesCategory &&
          [
            gig.title,
            gig.category,
            gig.description,
            gig.creatorName,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(query)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0) -
          new Date(a.createdAt || 0)
      );
  }, [gigs, search, category]);

  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-content">
            <div className="eyebrow">
              <span className="live-dot" />
              THE CREATOR ECONOMY, REIMAGINED
            </div>

            <h1>
              Find talent.
              <br />
              <span>Make things.</span>
            </h1>

            <p className="hero-description">
              SkillSwap connects ambitious people with creators who
              can turn ideas into real work — from one-off gigs to
              long-term collaborations.
            </p>

            <div className="hero-actions">
              <button
                className="button button-primary button-large"
                onClick={() =>
                  document
                    .getElementById("marketplace")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Explore creators
                <span>↓</span>
              </button>

              <button
                className="button button-ghost button-large"
                onClick={() => navigate("post")}
              >
                I’m a creator
                <span>↗</span>
              </button>
            </div>

            <div className="hero-proof">
              <div className="avatar-stack">
                <span>PC</span>
                <span>SK</span>
                <span>AR</span>
                <span>+</span>
              </div>

              <div>
                <strong>Built for creators</strong>
                <small>Simple gigs. Real opportunities.</small>
              </div>
            </div>
          </div>

          <HeroVisual />
        </div>
      </section>

      <section className="marketplace-section" id="marketplace">
        <div className="section-container">
          <div className="section-heading">
            <div>
              <span className="section-kicker">DISCOVER WORK</span>
              <h2>What are you looking for?</h2>
            </div>

            <span className="result-count">
              {gigs.length} {gigs.length === 1 ? "gig" : "gigs"} live
            </span>
          </div>

          <div className="search-panel">
            <div className="search-box">
              <span className="search-icon">⌕</span>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search video editing, design, writing..."
              />

              {search && (
                <button
                  className="clear-search"
                  onClick={() => setSearch("")}
                >
                  ×
                </button>
              )}
            </div>

            <button
              className="refresh-button"
              onClick={onRefresh}
              title="Refresh marketplace"
            >
              ↻
            </button>
          </div>

          <CategoryRail
            selected={category}
            setSelected={setCategory}
          />

          {loading ? (
            <GigSkeletonGrid />
          ) : filteredGigs.length ? (
            <div className="gig-grid">
              {filteredGigs.map((gig) => (
                <GigCard
                  key={gig.id}
                  gig={gig}
                  onBook={() => onBook(gig)}
                />
              ))}
            </div>
          ) : (
            <EmptyMarketplace
              search={search}
              category={category}
              clear={() => {
                setSearch("");
                setCategory("All");
              }}
              navigate={navigate}
            />
          )}
        </div>
      </section>

      <HowItWorks />

      <CreatorCTA navigate={navigate} />
    </>
  );
}

function HeroVisual() {
  return (
    <div className="hero-visual">
      <div className="visual-orbit orbit-one" />
      <div className="visual-orbit orbit-two" />

      <div className="visual-main-card">
        <div className="visual-topline">
          <span className="mini-label">TRENDING NOW</span>
          <span className="visual-live">
            <i />
            LIVE
          </span>
        </div>

        <div className="visual-creator">
          <div className="big-avatar">PC</div>

          <div>
            <span className="verified-name">
              PRINCE CHAUHAN
              <b>✓</b>
            </span>
            <small>Full-stack creator</small>
          </div>

          <span className="rating">★ 4.9</span>
        </div>

        <div className="visual-work">
          <div className="visual-work-art">
            <span>CREATE</span>
            <strong>WITH<br />PURPOSE.</strong>
          </div>

          <div className="visual-work-info">
            <span>Brand identity</span>
            <strong>₹2,500</strong>
          </div>
        </div>

        <button className="visual-book">
          Book this creator
          <span>→</span>
        </button>
      </div>

      <div className="floating-card floating-top">
        <span className="floating-icon">✦</span>
        <div>
          <strong>120+</strong>
          <small>Creative skills</small>
        </div>
      </div>

      <div className="floating-card floating-bottom">
        <span className="check-icon">✓</span>
        <div>
          <strong>Fast matching</strong>
          <small>Find your fit</small>
        </div>
      </div>

      <div className="cursor-badge">
        <span>✦</span>
        YOUR NEXT<br />COLLAB
      </div>
    </div>
  );
}

function CategoryRail({ selected, setSelected }) {
  return (
    <div className="category-wrapper">
      <div className="category-rail">
        {CATEGORIES.map((item) => {
          const meta = getCategoryMeta(item);

          return (
            <button
              key={item}
              className={`category-pill ${
                selected === item ? "selected" : ""
              }`}
              onClick={() => setSelected(item)}
            >
              {item !== "All" && (
                <span className={`category-icon ${meta.accent}`}>
                  {meta.icon}
                </span>
              )}
              {item}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function GigCard({ gig, onBook }) {
  const meta = getCategoryMeta(gig.category);

  return (
    <article className="gig-card">
      <div className={`gig-art ${meta.accent}`}>
        <span className="art-category">{gig.category}</span>

        <div className="art-symbol">{meta.icon}</div>

        <span className="art-number">
          {String(gig.id).padStart(2, "0")}
        </span>
      </div>

      <div className="gig-card-content">
        <div className="gig-category-row">
          <span>{gig.category}</span>
          <span className="gig-new-dot">
            {isNewGig(gig.createdAt) ? "NEW" : "AVAILABLE"}
          </span>
        </div>

        <h3>{gig.title}</h3>

        <p>
          {gig.description || "A creator-ready service for your next project."}
        </p>

        <div className="gig-footer">
          <div className="creator-mini">
            <span className="mini-avatar">
              {getInitials(gig.creatorName)}
            </span>

            <div>
              <strong>{gig.creatorName || "SkillSwap Creator"}</strong>
              <small>Creator</small>
            </div>
          </div>

          <div className="gig-price">
            <small>Starting at</small>
            <strong>{formatRate(gig.rate)}</strong>
          </div>
        </div>

        <button className="card-book-button" onClick={onBook}>
          Book gig
          <span>→</span>
        </button>
      </div>
    </article>
  );
}

function EmptyMarketplace({
  search,
  category,
  clear,
  navigate,
}) {
  return (
    <div className="empty-marketplace">
      <div className="empty-symbol">⌕</div>
      <span className="section-kicker">NOTHING HERE YET</span>

      <h3>
        {search
          ? `No gigs match "${search}"`
          : category !== "All"
          ? `No ${category} gigs yet`
          : "The marketplace is waiting for its first gig."}
      </h3>

      <p>
        Try another search or be the creator who starts the next
        opportunity.
      </p>

      <div className="empty-actions">
        {(search || category !== "All") && (
          <button className="button button-secondary" onClick={clear}>
            Clear filters
          </button>
        )}

        <button
          className="button button-primary"
          onClick={() => navigate("post")}
        >
          Post a gig
          <span>↗</span>
        </button>
      </div>
    </div>
  );
}

function GigSkeletonGrid() {
  return (
    <div className="gig-grid">
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <div className="skeleton-card" key={item}>
          <div className="skeleton skeleton-art" />
          <div className="skeleton-content">
            <div className="skeleton skeleton-line small" />
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line medium" />
            <div className="skeleton skeleton-line short" />
          </div>
        </div>
      ))}
    </div>
  );
}

function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Discover",
      text: "Search real creator services by skill, category and what you actually need.",
    },
    {
      number: "02",
      title: "Book",
      text: "Send your requirements directly through a simple booking request.",
    },
    {
      number: "03",
      title: "Create",
      text: "The creator accepts your request and you move from idea to execution.",
    },
  ];

  return (
    <section className="how-section">
      <div className="section-container">
        <div className="how-intro">
          <div>
            <span className="section-kicker">HOW IT WORKS</span>
            <h2>
              From “I need this”
              <br />
              to <span>“it’s done.”</span>
            </h2>
          </div>

          <p>
            SkillSwap removes the friction between people who have
            skills and people who need them.
          </p>
        </div>

        <div className="steps-grid">
          {steps.map((step) => (
            <div className="step-card" key={step.number}>
              <span className="step-number">{step.number}</span>
              <div className="step-line" />
              <h3>{step.title}</h3>
              <p>{step.text}</p>
              <span className="step-arrow">↗</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CreatorCTA({ navigate }) {
  return (
    <section className="creator-cta-section">
      <div className="section-container">
        <div className="creator-cta">
          <div className="cta-shape shape-one" />
          <div className="cta-shape shape-two" />

          <div className="cta-content">
            <span className="section-kicker">FOR CREATORS</span>

            <h2>
              Your skill is
              <br />
              <span>worth something.</span>
            </h2>

            <p>
              Turn what you’re good at into a service people can
              discover, book and pay for.
            </p>

            <button
              className="button button-light"
              onClick={() => navigate("post")}
            >
              Publish your first gig
              <span>↗</span>
            </button>
          </div>

          <div className="cta-stat">
            <strong>01</strong>
            <span>Post a skill</span>
            <small>Start with what you know.</small>
          </div>
        </div>
      </div>
    </section>
  );
}

function PostGig({ onSubmit, navigate }) {
  const [form, setForm] = useState({
    title: "",
    category: "",
    rate: "",
    description: "",
  });

  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (
      !form.title.trim() ||
      !form.category ||
      !form.rate ||
      !form.description.trim()
    ) {
      return;
    }

    try {
      setSubmitting(true);

      await onSubmit({
        title: form.title.trim(),
        category: form.category,
        rate: Number(form.rate),
        description: form.description.trim(),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="form-page">
      <div className="section-container">
        <div className="page-header">
          <button
            className="back-link"
            onClick={() => navigate("marketplace")}
          >
            ← Back to marketplace
          </button>

          <span className="section-kicker">CREATOR STUDIO</span>

          <h1>
            Put your skill
            <br />
            <span>on the map.</span>
          </h1>

          <p>
            Create a clear, compelling gig that tells clients exactly
            what you can do for them.
          </p>
        </div>

        <form className="gig-form" onSubmit={handleSubmit}>
          <div className="form-card">
            <div className="form-card-heading">
              <span>01</span>
              <div>
                <h2>Describe your service</h2>
                <p>Keep it specific. Clients should get it instantly.</p>
              </div>
            </div>

            <div className="form-grid">
              <label className="field full">
                <span>Gig title</span>
                <input
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                  placeholder="e.g. I will edit your short-form videos"
                  maxLength={100}
                />
              </label>

              <label className="field">
                <span>Category</span>
                <select
                  value={form.category}
                  onChange={(e) =>
                    update("category", e.target.value)
                  }
                >
                  <option value="">Choose a category</option>
                  {CATEGORIES.slice(1).map((item) => (
                    <option value={item} key={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Starting rate</span>

                <div className="price-input">
                  <span>₹</span>
                  <input
                    type="number"
                    min="1"
                    value={form.rate}
                    onChange={(e) => update("rate", e.target.value)}
                    placeholder="1500"
                  />
                </div>
              </label>

              <label className="field full">
                <span>Description</span>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    update("description", e.target.value)
                  }
                  placeholder="Tell clients what they get, what you need from them, and why they should choose your service..."
                  rows="7"
                  maxLength={600}
                />

                <small className="character-count">
                  {form.description.length}/600
                </small>
              </label>
            </div>
          </div>

          <div className="form-preview">
            <span className="section-kicker">LIVE PREVIEW</span>

            <div className="preview-card">
              <div className="preview-art">
                <span>{form.category || "YOUR SKILL"}</span>
                <strong>
                  {getCategoryMeta(form.category).icon}
                </strong>
              </div>

              <div className="preview-body">
                <span className="preview-label">
                  {form.category || "CATEGORY"}
                </span>

                <h3>
                  {form.title || "Your gig title will appear here"}
                </h3>

                <p>
                  {form.description ||
                    "Write a clear description of the service you want to offer."}
                </p>

                <div className="preview-bottom">
                  <span>Starting at</span>
                  <strong>
                    {form.rate
                      ? formatRate(form.rate)
                      : "₹0"}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="button button-secondary"
              onClick={() => navigate("marketplace")}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="button button-primary button-large"
              disabled={
                submitting ||
                !form.title ||
                !form.category ||
                !form.rate ||
                !form.description
              }
            >
              {submitting ? "Publishing..." : "Publish gig"}
              {!submitting && <span>↗</span>}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

function BookingModal({
  gig,
  success,
  onClose,
  onSubmit,
  onViewBookings,
}) {
  const [form, setForm] = useState({
    clientName: "",
    clientEmail: "",
    requirements: "",
  });

  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (
      !form.clientName.trim() ||
      !form.clientEmail.trim() ||
      !form.requirements.trim()
    ) {
      return;
    }

    try {
      setSubmitting(true);

      await onSubmit({
        gigId: gig.id,
        clientName: form.clientName.trim(),
        clientEmail: form.clientEmail.trim(),
        requirements: form.requirements.trim(),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className="booking-modal"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose}>
          ×
        </button>

        {!success ? (
          <>
            <div className="modal-header">
              <span className="modal-icon">
                {getCategoryMeta(gig.category).icon}
              </span>

              <div>
                <span className="section-kicker">BOOK A GIG</span>
                <h2>{gig.title}</h2>
                <p>
                  {gig.category} · {formatRate(gig.rate)}
                </p>
              </div>
            </div>

            <form className="booking-form" onSubmit={handleSubmit}>
              <label className="field">
                <span>Your name</span>
                <input
                  value={form.clientName}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      clientName: e.target.value,
                    })
                  }
                  placeholder="Prince Chauhan"
                />
              </label>

              <label className="field">
                <span>Email address</span>
                <input
                  type="email"
                  value={form.clientEmail}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      clientEmail: e.target.value,
                    })
                  }
                  placeholder="you@example.com"
                />
              </label>

              <label className="field">
                <span>What do you need?</span>
                <textarea
                  rows="5"
                  value={form.requirements}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      requirements: e.target.value,
                    })
                  }
                  placeholder="Describe your project, deliverables, deadline..."
                />
              </label>

              <div className="booking-note">
                <span>◷</span>
                <p>
                  Your request will be sent to the creator as
                  <strong> Pending</strong>.
                </p>
              </div>

              <button
                className="button button-primary button-full"
                disabled={
                  submitting ||
                  !form.clientName ||
                  !form.clientEmail ||
                  !form.requirements
                }
              >
                {submitting ? "Sending request..." : "Send booking request"}
                {!submitting && <span>→</span>}
              </button>
            </form>
          </>
        ) : (
          <div className="success-state">
            <div className="success-circle">✓</div>

            <span className="section-kicker">REQUEST SENT</span>

            <h2>Booking is on its way.</h2>

            <p>
              Your request for <strong>{gig.title}</strong> has been
              sent to the creator.
            </p>

            <div className="success-status">
              <span className="status-dot pending" />
              Pending
            </div>

            <div className="success-actions">
              <button
                className="button button-primary"
                onClick={onViewBookings}
              >
                View my bookings
                <span>→</span>
              </button>

              <button className="button button-secondary" onClick={onClose}>
                Keep exploring
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MyBookings({
  bookings,
  loading,
  navigate,
  onRefresh,
}) {
  return (
    <section className="dashboard-page">
      <div className="section-container">
        <div className="page-header compact">
          <div>
            <span className="section-kicker">CLIENT SPACE</span>
            <h1>
              My <span>bookings.</span>
            </h1>
            <p>
              Track every request and see what’s happening next.
            </p>
          </div>

          <button
            className="button button-secondary"
            onClick={onRefresh}
          >
            ↻ Refresh
          </button>
        </div>

        {loading ? (
          <BookingSkeleton />
        ) : bookings.length ? (
          <div className="bookings-list">
            {bookings.map((booking) => (
              <BookingItem
                booking={booking}
                key={booking.id}
                onBrowse={() => navigate("marketplace")}
              />
            ))}
          </div>
        ) : (
          <div className="empty-dashboard">
            <div className="empty-symbol">□</div>
            <span className="section-kicker">NO BOOKINGS YET</span>
            <h3>Your next collaboration starts here.</h3>
            <p>
              Explore the marketplace and book a creator for your
              next project.
            </p>
            <button
              className="button button-primary"
              onClick={() => navigate("marketplace")}
            >
              Explore gigs
              <span>→</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}


function BookingItem({ booking, onBrowse }) {
  const meta = getCategoryMeta(booking.category);
  const isDeclined = booking.status === "Declined";

  return (
    <article className="booking-item">
      <div className={`booking-art ${meta.accent}`}>
        <span>{meta.icon}</span>
      </div>

      <div className="booking-main">
        <div className="booking-top">
          <div>
            <span className="booking-category">
              {booking.category || "Creator service"}
            </span>
            <h3>{booking.gigTitle || "Untitled gig"}</h3>
          </div>

          <StatusBadge status={booking.status} />
        </div>

        <p>
          {booking.requirements || "No additional requirements provided."}
        </p>

        <div className="booking-meta">
          <span>
            <small>Client</small>
            {booking.clientName || "—"}
          </span>

          <span>
            <small>Email</small>
            {booking.clientEmail || "—"}
          </span>

          <span>
            <small>Rate</small>
            {formatRate(booking.rate)}
          </span>
        </div>

        {isDeclined && (
          <div className="declined-action">
            <span>This booking was declined.</span>

            <button
              type="button"
              className="text-button"
              onClick={onBrowse}
            >
              Browse other gigs →
            </button>
          </div>
        )}
      </div>
    </article>
  );
}


function CreatorDashboard({
  bookings,
  loading,
  onAction,
  onRefresh,
}) {
  const pending = bookings.filter(
    (booking) => booking.status === "Pending"
  ).length;

  const accepted = bookings.filter(
    (booking) => booking.status === "Accepted"
  ).length;

  const declined = bookings.filter(
    (booking) => booking.status === "Declined"
  ).length;

  return (
    <section className="dashboard-page">
      <div className="section-container">
        <div className="page-header compact dashboard-heading">
          <div>
            <span className="section-kicker">CREATOR STUDIO</span>
            <h1>
              Your <span>inbox.</span>
            </h1>
            <p>
              Manage incoming requests and turn opportunities into
              collaborations.
            </p>
          </div>

          <button
            className="button button-secondary"
            onClick={onRefresh}
          >
            ↻ Refresh
          </button>
        </div>

        <div className="stats-grid">
          <StatCard
            label="Pending"
            value={pending}
            symbol="◷"
            className="stat-pending"
          />

          <StatCard
            label="Accepted"
            value={accepted}
            symbol="✓"
            className="stat-accepted"
          />

          <StatCard
            label="Declined"
            value={declined}
            symbol="×"
            className="stat-declined"
          />

          <StatCard
            label="Total requests"
            value={bookings.length}
            symbol="↗"
            className="stat-total"
          />
        </div>

        <div className="dashboard-section-title">
          <div>
            <span className="section-kicker">INCOMING</span>
            <h2>Booking requests</h2>
          </div>

          {pending > 0 && (
            <span className="pending-count">
              {pending} waiting for your response
            </span>
          )}
        </div>

        {loading ? (
          <BookingSkeleton />
        ) : bookings.length ? (
          <div className="creator-requests">
            {bookings.map((booking) => (
              <CreatorRequest
                booking={booking}
                key={booking.id}
                onAction={onAction}
              />
            ))}
          </div>
        ) : (
          <div className="empty-dashboard">
            <div className="empty-symbol">✦</div>
            <span className="section-kicker">YOUR INBOX IS CLEAR</span>
            <h3>No booking requests yet.</h3>
            <p>
              Once clients discover your gigs, their requests will
              appear here.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function StatCard({ label, value, symbol, className }) {
  return (
    <div className={`stat-card ${className}`}>
      <div className="stat-top">
        <span>{label}</span>
        <b>{symbol}</b>
      </div>

      <strong>{value}</strong>
    </div>
  );
}

function CreatorRequest({ booking, onAction }) {
  const meta = getCategoryMeta(booking.category);

  return (
    <article className="creator-request">
      <div className={`request-art ${meta.accent}`}>
        <span>{meta.icon}</span>
      </div>

      <div className="request-content">
        <div className="request-heading">
          <div>
            <span className="booking-category">
              {booking.category || "Creator service"}
            </span>

            <h3>{booking.gigTitle || "Untitled gig"}</h3>
          </div>

          <StatusBadge status={booking.status} />
        </div>

        <div className="request-client">
          <span className="mini-avatar">
            {getInitials(booking.clientName)}
          </span>

          <div>
            <strong>{booking.clientName || "Client"}</strong>
            <small>{booking.clientEmail || "No email"}</small>
          </div>
        </div>

        <div className="requirements-box">
          <span>PROJECT REQUIREMENTS</span>
          <p>
            {booking.requirements ||
              "No requirements provided by the client."}
          </p>
        </div>

        <div className="request-bottom">
          <div>
            <small>PROJECT VALUE</small>
            <strong>{formatRate(booking.rate)}</strong>
          </div>

          {booking.status === "Pending" ? (
            <div className="request-actions">
              <button
                className="decline-button"
                onClick={() => onAction(booking.id, "decline")}
              >
                Decline
              </button>

              <button
                className="accept-button"
                onClick={() => onAction(booking.id, "accept")}
              >
                Accept request
                <span>→</span>
              </button>
            </div>
          ) : (
            <span className="request-complete">
              {booking.status === "Accepted"
                ? "✓ Request accepted"
                : "Request declined"}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

function StatusBadge({ status }) {
  const normalized = status || "Pending";

  return (
    <span
      className={`status-badge ${normalized.toLowerCase()}`}
    >
      <i />
      {normalized}
    </span>
  );
}

function BookingSkeleton() {
  return (
    <div className="booking-skeleton-list">
      {[1, 2, 3].map((item) => (
        <div className="booking-skeleton" key={item}>
          <div className="skeleton skeleton-square" />
          <div className="skeleton-lines">
            <div className="skeleton skeleton-line small" />
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line medium" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Footer({ navigate }) {
  return (
    <footer className="footer">
      <div className="footer-main section-container">
        <div className="footer-brand">
          <button
            className="brand footer-logo"
            onClick={() => navigate("marketplace")}
          >
            <span className="brand-mark">
              <span />
              <span />
            </span>

            <span className="brand-copy">
              <strong>Skill</strong>
              <em>Swap</em>
            </span>
          </button>

          <p>
            A creator marketplace for skills, services and the
            people who make things happen.
          </p>
        </div>

        <div className="footer-links">
          <div>
            <span>EXPLORE</span>
            <button onClick={() => navigate("marketplace")}>
              Marketplace
            </button>
            <button onClick={() => navigate("bookings")}>
              My bookings
            </button>
          </div>

          <div>
            <span>CREATE</span>
            <button onClick={() => navigate("post")}>
              Post a gig
            </button>
            <button onClick={() => navigate("dashboard")}>
              Dashboard
            </button>
          </div>
        </div>

        <div className="footer-tagline">
          <span>BUILD</span>
          <strong>
            Ideas deserve
            <br />
            great people.
          </strong>
        </div>
      </div>

      <div className="footer-bottom section-container">
        <span>SkillSwap © 2026</span>

        <span>
          Developed by{" "}
          <strong className="developer-names">
            PRINCE CHAUHAN 
          </strong>
        </span>
      </div>
    </footer>
  );
}

function Toast({ toast }) {
  return (
    <div className={`toast ${toast.type}`}>
      <span className="toast-icon">
        {toast.type === "error" ? "!" : "✓"}
      </span>

      <span>{toast.message}</span>
    </div>
  );
}

function getInitials(name) {
  if (!name) return "SK";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function isNewGig(date) {
  if (!date) return false;

  const created = new Date(date).getTime();

  if (Number.isNaN(created)) return false;

  return Date.now() - created < 1000 * 60 * 60 * 24 * 3;
}