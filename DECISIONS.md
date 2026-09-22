# SkillSwap — Product Decisions

## DP1 — What happens after a creator declines?

**Decision:** When a creator declines a booking, the client sees the booking status as `Declined` and gets a clear **“Browse other gigs”** action. The original declined booking cannot be edited or reactivated.

This keeps the booking history accurate and gives the client an immediate next step instead of leaving them stuck on a declined request. The client can return to the marketplace and submit a new booking with another creator.

## DP2 — Can a gig accept another booking while one is Pending?

**Decision:** No. A gig cannot receive another booking while it already has a `Pending` booking.

This avoids multiple simultaneous requests for the same gig and prevents ambiguity for the creator. The rule is enforced by the backend, so it cannot be bypassed by simply submitting another request from the frontend.

## DP3 — How are gigs ranked in discovery?

**Decision:** Gigs are displayed newest-first after applying the user's search and category filters.

This gives newly posted creator opportunities visibility without favoring gigs based on price. Search and category filtering happen before the newest-first ordering so users can still discover relevant services efficiently.

## API

**Standard API implemented:** Yes.

SkillSwap uses a REST-style HTTP API with endpoints for gigs and bookings, including creating gigs, browsing gigs, creating bookings, viewing client/creator bookings, and accepting or declining bookings.

