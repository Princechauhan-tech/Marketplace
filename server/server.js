const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 5000;
const DATA_FILE = path.join(__dirname, "data.json");

app.use(cors());
app.use(express.json());

/* -----------------------------
   Database helpers
----------------------------- */

function readDatabase() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            const initialData = {
                gigs: [],
                bookings: [],
            };

            fs.writeFileSync(
                DATA_FILE,
                JSON.stringify(initialData, null, 2),
                "utf8"
            );

            return initialData;
        }

        const file = fs.readFileSync(DATA_FILE, "utf8");

        if (!file.trim()) {
            return {
                gigs: [],
                bookings: [],
            };
        }

        return JSON.parse(file);
    } catch (error) {
        console.error("Database read error:", error);
        throw new Error("Unable to read database.");
    }
}

function writeDatabase(data) {
    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(data, null, 2),
        "utf8"
    );
}

function getNextId(items) {
    if (items.length === 0) return 1;

    return (
        Math.max(
            ...items.map((item) => Number(item.id) || 0)
        ) + 1
    );
}

function clean(value) {
    return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* -----------------------------
   Health check
----------------------------- */

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "SkillSwap API is running",
    });
});

/* -----------------------------
   GIGS
----------------------------- */

// GET all gigs
app.get("/api/gigs", (req, res) => {
    try {
        const db = readDatabase();

        const gigs = [...db.gigs].sort(
            (a, b) =>
            new Date(b.createdAt) -
            new Date(a.createdAt)
        );

        res.json(gigs);
    } catch (error) {
        console.error("GET /api/gigs:", error);

        res.status(500).json({
            message: "Unable to load gigs. Please try again.",
        });
    }
});

// CREATE gig
app.post("/api/gigs", (req, res) => {
    try {
        const title = clean(req.body.title);
        const category = clean(req.body.category);
        const description = clean(req.body.description);
        const rate = Number(req.body.rate);

        if (!title) {
            return res.status(400).json({
                message: "Gig title is required.",
            });
        }

        if (!category) {
            return res.status(400).json({
                message: "Category is required.",
            });
        }

        if (!Number.isFinite(rate) || rate <= 0) {
            return res.status(400).json({
                message: "Rate must be greater than 0.",
            });
        }

        if (!description) {
            return res.status(400).json({
                message: "Description is required.",
            });
        }

        const db = readDatabase();

        const newGig = {
            id: getNextId(db.gigs),
            title,
            category,
            rate,
            description,

            // No authentication in hackathon.
            creatorName: clean(req.body.creatorName) ||
                "Prince Chauhan",

            createdAt: new Date().toISOString(),
        };

        db.gigs.push(newGig);

        writeDatabase(db);

        res.status(201).json(newGig);
    } catch (error) {
        console.error("POST /api/gigs:", error);

        res.status(500).json({
            message: "Unable to create gig. Please try again.",
        });
    }
});

// GET single gig
app.get("/api/gigs/:id", (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id)) {
            return res.status(400).json({
                message: "Invalid gig ID.",
            });
        }

        const db = readDatabase();

        const gig = db.gigs.find(
            (item) => Number(item.id) === id
        );

        if (!gig) {
            return res.status(404).json({
                message: "Gig not found.",
            });
        }

        res.json(gig);
    } catch (error) {
        console.error("GET /api/gigs/:id:", error);

        res.status(500).json({
            message: "Unable to load gig details.",
        });
    }
});

/* -----------------------------
   BOOKINGS
----------------------------- */

// CREATE booking
app.post("/api/bookings", (req, res) => {
    try {
        const gigId = Number(req.body.gigId);
        const clientName = clean(req.body.clientName);
        const clientEmail = clean(req.body.clientEmail);
        const requirements = clean(req.body.requirements);

        if (!Number.isInteger(gigId)) {
            return res.status(400).json({
                message: "Valid gig ID is required.",
            });
        }

        if (!clientName) {
            return res.status(400).json({
                message: "Client name is required.",
            });
        }

        if (!clientEmail) {
            return res.status(400).json({
                message: "Client email is required.",
            });
        }

        if (!isValidEmail(clientEmail)) {
            return res.status(400).json({
                message: "Please enter a valid email address.",
            });
        }

        if (!requirements) {
            return res.status(400).json({
                message: "Requirements are required.",
            });
        }

        const db = readDatabase();

        // Find requested gig
        const gig = db.gigs.find(
            (item) => Number(item.id) === gigId
        );

        if (!gig) {
            return res.status(404).json({
                message: "Gig not found.",
            });
        }

        /*
          DP2:
          A gig cannot receive another booking
          while it already has a Pending booking.
        */

        const pendingBooking = db.bookings.find(
            (booking) =>
            Number(booking.gigId) === gigId &&
            booking.status === "Pending"
        );

        if (pendingBooking) {
            return res.status(409).json({
                message: "This gig already has a pending booking. Please choose another gig.",
            });
        }

        const booking = {
            id: getNextId(db.bookings),

            gigId: gig.id,
            gigTitle: gig.title,
            category: gig.category,
            rate: gig.rate,

            clientName,
            clientEmail,
            requirements,

            status: "Pending",

            createdAt: new Date().toISOString(),
        };

        db.bookings.push(booking);

        writeDatabase(db);

        res.status(201).json(booking);
    } catch (error) {
        console.error("POST /api/bookings:", error);

        res.status(500).json({
            message: "Unable to create booking. Please try again.",
        });
    }
});

/* -----------------------------
   CLIENT BOOKINGS
----------------------------- */

// GET client bookings
app.get("/api/bookings/client", (req, res) => {
    try {
        const db = readDatabase();

        const email = clean(req.query.email);

        let bookings = [...db.bookings];

        // Optional email filtering.
        // Useful because the hackathon has no auth.
        if (email) {
            bookings = bookings.filter(
                (booking) =>
                booking.clientEmail.toLowerCase() ===
                email.toLowerCase()
            );
        }

        bookings.sort(
            (a, b) =>
            new Date(b.createdAt) -
            new Date(a.createdAt)
        );

        res.json(bookings);
    } catch (error) {
        console.error(
            "GET /api/bookings/client:",
            error
        );

        res.status(500).json({
            message: "Unable to load bookings. Please try again.",
        });
    }
});

/* -----------------------------
   CREATOR DASHBOARD
----------------------------- */

// GET creator bookings
app.get("/api/bookings/creator", (req, res) => {
    try {
        const db = readDatabase();

        const bookings = [...db.bookings].sort(
            (a, b) =>
            new Date(b.createdAt) -
            new Date(a.createdAt)
        );

        res.json(bookings);
    } catch (error) {
        console.error(
            "GET /api/bookings/creator:",
            error
        );

        res.status(500).json({
            message: "Unable to load creator requests. Please try again.",
        });
    }
});

/* -----------------------------
   ACCEPT BOOKING
----------------------------- */

app.patch("/api/bookings/:id/accept", (req, res) => {
    try {
        const bookingId = Number(req.params.id);

        if (!Number.isInteger(bookingId)) {
            return res.status(400).json({
                message: "Invalid booking ID.",
            });
        }

        const db = readDatabase();

        const booking = db.bookings.find(
            (item) =>
            Number(item.id) === bookingId
        );

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found.",
            });
        }

        if (booking.status !== "Pending") {
            return res.status(400).json({
                message: `This booking is already ${booking.status.toLowerCase()}.`,
            });
        }

        booking.status = "Accepted";

        writeDatabase(db);

        res.json(booking);
    } catch (error) {
        console.error(
            "PATCH /api/bookings/:id/accept:",
            error
        );

        res.status(500).json({
            message: "Unable to accept booking. Please try again.",
        });
    }
});

/* -----------------------------
   DECLINE BOOKING
----------------------------- */

app.patch("/api/bookings/:id/decline", (req, res) => {
    try {
        const bookingId = Number(req.params.id);

        if (!Number.isInteger(bookingId)) {
            return res.status(400).json({
                message: "Invalid booking ID.",
            });
        }

        const db = readDatabase();

        const booking = db.bookings.find(
            (item) =>
            Number(item.id) === bookingId
        );

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found.",
            });
        }

        if (booking.status !== "Pending") {
            return res.status(400).json({
                message: `This booking is already ${booking.status.toLowerCase()}.`,
            });
        }

        booking.status = "Declined";

        writeDatabase(db);

        res.json(booking);
    } catch (error) {
        console.error(
            "PATCH /api/bookings/:id/decline:",
            error
        );

        res.status(500).json({
            message: "Unable to decline booking. Please try again.",
        });
    }
});

/* -----------------------------
   404
----------------------------- */

app.use((req, res) => {
    res.status(404).json({
        message: "API endpoint not found.",
    });
});

/* -----------------------------
   Global error handler
----------------------------- */

app.use((error, req, res, next) => {
    console.error("Unhandled error:", error);

    res.status(500).json({
        message: "Something went wrong on the server.",
    });
});

/* -----------------------------
   Start server
----------------------------- */

app.listen(PORT, () => {
    console.log("");
    console.log("==========================================");
    console.log("          SkillSwap API Server");
    console.log("==========================================");
    console.log(`Server: http://localhost:${PORT}`);
    console.log(
        `Health: http://localhost:${PORT}/api/health`
    );
    console.log("==========================================");
    console.log("");
});