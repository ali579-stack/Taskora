import express from "express";

import { pool } from "../config/database.js";

import {
  requireAuth,
  requireRole
} from "../middleware/auth.js";

const router = express.Router();


/*
==================================================
WORKER — EARNINGS SUMMARY
==================================================
*/

router.get(
  "/summary",
  requireAuth,
  requireRole("worker"),
  async (req, res) => {

    try {

      const result = await pool.query(
        `
        SELECT

          COALESCE(
            SUM(
              CASE
                WHEN type = 'task_reward'
                THEN amount
                ELSE 0
              END
            ),
            0
          ) AS total_earned,

          COUNT(
            CASE
              WHEN type = 'task_reward'
              THEN 1
            END
          ) AS completed_tasks

        FROM transactions

        WHERE user_id = $1
        `,
        [req.user.id]
      );


      const withdrawalResult =
        await pool.query(
          `
          SELECT
            COALESCE(
              SUM(amount),
              0
            ) AS withdrawn

          FROM withdrawals

          WHERE user_id = $1

            AND status IN (
              'pending',
              'processing',
              'completed'
            )
          `,
          [req.user.id]
        );


      const totalEarned =
        Number(
          result.rows[0].total_earned
        );


      const withdrawn =
        Number(
          withdrawalResult.rows[0].withdrawn
        );


      const available =
        Math.max(
          totalEarned - withdrawn,
          0
        );


      res.json({

        success: true,

        earnings: {

          totalEarned,

          withdrawn,

          available,

          completedTasks:
            Number(
              result.rows[0].completed_tasks
            )

        }

      });


    } catch (error) {

      console.error(error);

      res.status(500).json({
        success: false,
        message:
          "Unable to load earnings"
      });

    }

  }
);


/*
==================================================
WORKER — TRANSACTIONS
==================================================
*/

router.get(
  "/transactions",
  requireAuth,
  requireRole("worker"),
  async (req, res) => {

    try {

      const result = await pool.query(
        `
        SELECT
          id,
          type,
          amount,
          description,
          status,
          created_at

        FROM transactions

        WHERE user_id = $1

        ORDER BY created_at DESC
        `,
        [req.user.id]
      );


      res.json({
        success: true,
        transactions: result.rows
      });


    } catch (error) {

      console.error(error);

      res.status(500).json({
        success: false,
        message:
          "Unable to load transactions"
      });

    }

  }
);


export default router;