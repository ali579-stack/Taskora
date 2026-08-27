import settingsRouter from "./routes/settings.js";
import authRouter from "./routes/auth.js";
import submissionsRouter from "./routes/submissions.js";
import adminRouter from "./routes/admin.js";
import withdrawalsRouter from "./routes/withdrawls.js";
import earningsRouter from "./routes/earnings.js";
import tasksRouter from "./routes/tasks.js";
import express from "express";
import helmet from "helmet";
import { apiLimiter } from "./middleware/rateLimiter.js";
import cors from "cors";
import dotenv from "dotenv";
import pg from "pg";
import jwt from "jsonwebtoken";
import { requireAuth } from "./middleware/auth.js";
import path from "path";
import { fileURLToPath } from "url";

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_DIR = path.resolve(__dirname, "..");

dotenv.config();

const app = express();

app.use(helmet());
app.use("/api", apiLimiter);
const PORT = Number(process.env.PORT) || 3000;

/* =========================================================
   DATABASE
   ========================================================= */

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  // Useful if your PostgreSQL database requires SSL.
  // Set DATABASE_SSL=true in .env when needed.
  ssl:
    process.env.DATABASE_SSL === "true"
      ? { rejectUnauthorized: false }
      : false
});


/* =========================================================
   MIDDLEWARE
   ========================================================= */

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.RENDER_EXTERNAL_URL,
  "http://localhost:3000"
].filter(Boolean);

app.use(
  cors({
    origin: function(origin, callback){
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS blocked"));
      }
    },
    credentials: true
  })
);

app.use(express.json());
app.use(express.static(FRONTEND_DIR, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith(".js") || filePath.endsWith(".css")) {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    }
  }
}));
app.use("/api", authRouter);
app.use("/api/submissions", submissionsRouter);
app.use("/api/admin", adminRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/withdrawals", withdrawalsRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/earnings", earningsRouter);


/* =========================================================
   BASIC HEALTH CHECK
   ========================================================= */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "TASKORA backend is running!",
    port: PORT
  });
});


app.get("/api/health", async (req, res) => {

  try {

    await pool.query("SELECT 1");

    res.json({
      success: true,
      server: "online",
      database: "connected"
    });

  } catch (error) {

    console.error("Health check database error:", error);

    res.status(500).json({
      success: false,
      server: "online",
      database: "disconnected"
    });

  }

});


/* =========================================================
   AUTHENTICATION
   ========================================================= */

/*
   IMPORTANT:

   This is a temporary/simple authentication middleware.

   It expects the frontend to send:

   Authorization: Bearer USER_ID

   Example:

   Authorization: Bearer 1

   Replace this later with your real JWT/session
   authentication system if you already have one.
*/



/* =========================================================
   CURRENT USER PROFILE
   ========================================================= */

app.get(
  "/api/me",
  requireAuth,
  async (req, res) => {
    try {
      const result = await pool.query(
        `
        SELECT
          id,
          name,
          email,
          role,
          created_at
        FROM users
        WHERE id = $1
        LIMIT 1
        `,
        [req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found."
        });
      }

      res.json({
        success: true,
        user: result.rows[0]
      });

    } catch (error) {
      console.error("GET /api/me error:", error);

      res.status(500).json({
        success: false,
        message: "Unable to load profile."
      });
    }
  }
);

/* =========================================================
   SOCIAL / LINKED ACCOUNTS
   ========================================================= */

const SOCIAL_LIMITS = {
  instagram: 3,
  tiktok: 3,
  youtube: 2,
  facebook: 2,
  x: 2,
  other: 2
};

const MAX_LINKED_ACCOUNTS = 14;


/* ---------------------------------------------------------
   GET LINKED ACCOUNTS
--------------------------------------------------------- */

app.get(
  "/api/social-accounts",
  requireAuth,
  async (req, res) => {

    try {

      const result = await pool.query(
        `
        SELECT
          id,
          platform,
          account_name,
          verification_status,
          created_at
        FROM social_accounts
        WHERE user_id = $1
        ORDER BY created_at DESC
        `,
        [req.user.id]
      );


      res.json({
        success: true,
        accounts: result.rows
      });

    } catch (error) {

      console.error(
        "GET social accounts error:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Unable to load linked accounts."
      });

    }

  }
);


/* ---------------------------------------------------------
   ADD LINKED ACCOUNT
--------------------------------------------------------- */

app.post(
  "/api/social-accounts",
  requireAuth,
  async (req, res) => {

    try {

      const platform =
        String(req.body.platform || "")
          .trim()
          .toLowerCase();

      const accountName =
        String(req.body.accountName || "")
          .trim();


      if (!Object.prototype.hasOwnProperty.call(
        SOCIAL_LIMITS,
        platform
      )) {

        return res.status(400).json({
          success: false,
          message: "Unsupported social platform."
        });

      }


      if (!accountName) {

        return res.status(400).json({
          success: false,
          message: "Account name is required."
        });

      }


      /* ---------------------------------------------------
         TOTAL ACCOUNT LIMIT
      --------------------------------------------------- */

      const totalResult = await pool.query(
        `
        SELECT COUNT(*)::int AS count
        FROM social_accounts
        WHERE user_id = $1
        `,
        [req.user.id]
      );


      const totalAccounts =
        Number(totalResult.rows[0].count);


      if (totalAccounts >= MAX_LINKED_ACCOUNTS) {

        return res.status(400).json({
          success: false,
          message:
            "You have reached the maximum of 14 linked accounts."
        });

      }


      /* ---------------------------------------------------
         PLATFORM LIMIT
      --------------------------------------------------- */

      const platformResult = await pool.query(
        `
        SELECT COUNT(*)::int AS count
        FROM social_accounts
        WHERE user_id = $1
          AND platform = $2
        `,
        [
          req.user.id,
          platform
        ]
      );


      const platformAccounts =
        Number(platformResult.rows[0].count);


      if (
        platformAccounts >=
        SOCIAL_LIMITS[platform]
      ) {

        return res.status(400).json({
          success: false,
          message:
            `You can link a maximum of ${SOCIAL_LIMITS[platform]} ${platform} accounts.`
        });

      }


      /* ---------------------------------------------------
         DUPLICATE CHECK
      --------------------------------------------------- */

      const duplicateResult =
        await pool.query(
          `
          SELECT id
          FROM social_accounts
          WHERE user_id = $1
            AND platform = $2
            AND LOWER(account_name) = LOWER($3)
          LIMIT 1
          `,
          [
            req.user.id,
            platform,
            accountName
          ]
        );


      if (duplicateResult.rows.length > 0) {

        return res.status(409).json({
          success: false,
          message:
            "This account is already linked."
        });

      }


      /* ---------------------------------------------------
         INSERT
      --------------------------------------------------- */

      const result = await pool.query(
        `
        INSERT INTO social_accounts
        (
          user_id,
          platform,
          account_name,
          verification_status
        )
        VALUES
        (
          $1,
          $2,
          $3,
          'pending'
        )
        RETURNING
          id,
          platform,
          account_name,
          verification_status,
          created_at
        `,
        [
          req.user.id,
          platform,
          accountName
        ]
      );


      res.status(201).json({
        success: true,
        message:
          "Account added successfully. Verification is pending.",
        account: result.rows[0]
      });

    } catch (error) {

      console.error(
        "POST social account error:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Unable to add linked account."
      });

    }

  }
);


/* ---------------------------------------------------------
   DELETE LINKED ACCOUNT
--------------------------------------------------------- */

app.delete(
  "/api/social-accounts/:id",
  requireAuth,
  async (req, res) => {

    try {

      const accountId =
        Number(req.params.id);


      if (!Number.isInteger(accountId)) {

        return res.status(400).json({
          success: false,
          message: "Invalid account ID."
        });

      }


      const result = await pool.query(
        `
        DELETE FROM social_accounts
        WHERE id = $1
          AND user_id = $2
        RETURNING id
        `,
        [
          accountId,
          req.user.id
        ]
      );


      if (result.rows.length === 0) {

        return res.status(404).json({
          success: false,
          message: "Linked account not found."
        });

      }


      res.json({
        success: true,
        message: "Linked account removed."
      });

    } catch (error) {

      console.error(
        "DELETE social account error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to remove linked account."
      });

    }

  }
);


/* =========================================================
   404 HANDLER
   ========================================================= */

app.use((req, res) => {

  res.status(404).json({
    success: false,
    message: "Route not found.",
    path: req.originalUrl
  });

});


/* =========================================================
   GLOBAL ERROR HANDLER
   ========================================================= */

app.use((error, req, res, next) => {

  console.error("Unhandled server error:", error);

  res.status(500).json({
    success: false,
    message: "Internal server error."
  });

});


/* =========================================================
   START SERVER
   ========================================================= */

app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      `TASKORA server running on port ${PORT}`
    );

  }
);