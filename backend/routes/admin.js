import express from "express";
import { pool } from "../config/database.js";
import {
  requireAuth,
  requireRole
} from "../middleware/auth.js";
import {
  getPlatformSettings,
  calculateTaskFinance
} from "../services/finance.js";

const router = express.Router();
/*
==================================================
ADMIN — WITHDRAWAL SUMMARY
==================================================
*/

router.get(
  "/withdrawals/summary",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {

    try {

      const result = await pool.query(`
        SELECT
          COUNT(*) FILTER (
            WHERE status = 'pending'
          ) AS pending_count,

          COUNT(*) FILTER (
            WHERE status = 'processing'
          ) AS processing_count,

          COUNT(*) FILTER (
            WHERE status = 'completed'
          ) AS completed_count,

          COALESCE(
            SUM(amount) FILTER (
              WHERE status IN (
                'pending',
                'processing'
              )
            ),
            0
          ) AS pending_amount

        FROM withdrawals
      `);

      res.json({
        success: true,
        summary: result.rows[0]
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        success: false,
        message: "Unable to load withdrawal summary"
      });

    }
  }
);
/*
==================================================
ADMIN — FINANCE SETTINGS
==================================================
*/

router.get(
  "/finance/settings",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {

    try {

      const settings =
        await getPlatformSettings();


      res.json({

        success: true,

        settings: {

          feeRate:
            Number(settings.fee_rate),

          currency:
            settings.currency,

          minimumWithdrawal:
            Number(
              settings.minimum_withdrawal
            )

        }

      });


    } catch (error) {

      console.error(error);

      res.status(500).json({

        success: false,

        message:
          "Unable to load finance settings"

      });

    }

  }
);


/*
==================================================
ADMIN — CALCULATE TASK FINANCE
==================================================
*/

router.post(
  "/finance/calculate",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {

    try {

      const {
        fundingAmount
      } = req.body;


      const settings =
        await getPlatformSettings();


      const finance =
        calculateTaskFinance(
          fundingAmount,
          settings.fee_rate
        );


      res.json({

        success: true,

        finance: {

          ...finance,

          feeRate:
            Number(settings.fee_rate),

          currency:
            settings.currency

        }

      });


    } catch (error) {

      console.error(error);

      res.status(400).json({

        success: false,

        message:
          error.message ||
          "Unable to calculate task finance"

      });

    }

  }
);

export default router;
