import express from "express";

import { pool } from "../config/database.js";

import {
  requireAuth,
  requireRole
} from "../middleware/auth.js";

const router = express.Router();


/*
==================================================
WORKER — REQUEST WITHDRAWAL
==================================================
*/

router.post(
  "/",
  requireAuth,
  requireRole("worker"),
  async (req, res) => {

    const client = await pool.connect();

    try {

      const {
        amount,
        method,
        accountReference
      } = req.body;


      const withdrawalAmount =
        Number(amount);


      if (
        !Number.isFinite(withdrawalAmount) ||
        withdrawalAmount <= 0
      ) {

        return res.status(400).json({
          success: false,
          message: "Invalid withdrawal amount"
        });

      }


      const settingsResult = await pool.query(
        `SELECT minimum_withdrawal
         FROM platform_settings
         ORDER BY id
         LIMIT 1`
      );

      const minimumWithdrawal =
        Number(settingsResult.rows[0]?.minimum_withdrawal ?? 0);

      if (withdrawalAmount < minimumWithdrawal) {
        return res.status(400).json({
          success: false,
          message:
            `Minimum withdrawal is \$${minimumWithdrawal.toFixed(2)}`
        });
      }


      if (!method || !accountReference) {

        return res.status(400).json({
          success: false,
          message:
            "Withdrawal method and account are required"
        });

      }


      await client.query("BEGIN");


      /*
        Calculate worker's total earned.
      */

      const earnedResult =
        await client.query(
          `
          SELECT
            COALESCE(
              SUM(amount),
              0
            ) AS total_earned

          FROM transactions

          WHERE user_id = $1

            AND type = 'task_reward'

            AND status = 'completed'
          `,
          [req.user.id]
        );


      /*
        Calculate money already
        reserved for withdrawals.
      */

      const withdrawalResult =
        await client.query(
          `
          SELECT
            COALESCE(
              SUM(amount),
              0
            ) AS reserved

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
          earnedResult.rows[0].total_earned
        );


      const reserved =
        Number(
          withdrawalResult.rows[0].reserved
        );


      const available =
        totalEarned - reserved;


      if (
        withdrawalAmount > available
      ) {

        await client.query("ROLLBACK");

        return res.status(400).json({
          success: false,
          message:
            `Insufficient balance. Available: \$${available.toFixed(2)}`
        });

      }


      /*
        Create withdrawal.
      */

      const result =
        await client.query(
          `
          INSERT INTO withdrawals
          (
            user_id,
            amount,
            method,
            account_reference,
            status
          )
          VALUES
          (
            $1,
            $2,
            $3,
            $4,
            'pending'
          )
          RETURNING *
          `,
          [
            req.user.id,
            withdrawalAmount,
            method,
            accountReference
          ]
        );


      /*
        Notify worker.
      */

      await client.query(
        `
        INSERT INTO notifications
        (
          user_id,
          title,
          message
        )
        VALUES
        (
          $1,
          $2,
          $3
        )
        `,
        [
          req.user.id,
          "Withdrawal Requested",
          `Your withdrawal request for \$${withdrawalAmount.toFixed(2)} is pending review.`
        ]
      );


      await client.query("COMMIT");


      res.status(201).json({

        success: true,

        message:
          "Withdrawal request submitted",

        withdrawal:
          result.rows[0]

      });


    } catch (error) {

      await client.query("ROLLBACK");

      console.error(error);

      res.status(500).json({
        success: false,
        message:
          "Unable to create withdrawal"
      });

    } finally {

      client.release();

    }

  }
);


/*
==================================================
WORKER — MY WITHDRAWALS
==================================================
*/

router.get(
  "/mine",
  requireAuth,
  requireRole("worker"),
  async (req, res) => {

    try {

      const result =
        await pool.query(
          `
          SELECT
            id,
            amount,
            method,
            account_reference,
            status,
            requested_at,
            processed_at

          FROM withdrawals

          WHERE user_id = $1

          ORDER BY requested_at DESC
          `,
          [req.user.id]
        );


      res.json({
        success: true,
        withdrawals: result.rows
      });


    } catch (error) {

      console.error(error);

      res.status(500).json({
        success: false,
        message:
          "Unable to load withdrawals"
      });

    }

  }
);


/*
==================================================
ADMIN — PENDING WITHDRAWALS
==================================================
*/

router.get(
  "/admin/pending",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {

    try {

      const result =
        await pool.query(
          `
          SELECT

            w.*,

            p.name AS worker_name,

            p.email AS worker_email

          FROM withdrawals w

          JOIN profiles p
            ON p.id = w.user_id

          WHERE w.status = 'pending'

          ORDER BY w.requested_at ASC
          `
        );


      res.json({
        success: true,
        withdrawals: result.rows
      });


    } catch (error) {

      console.error(error);

      res.status(500).json({
        success: false,
        message:
          "Unable to load pending withdrawals"
      });

    }

  }
);


/*
==================================================
ADMIN — START PROCESSING
==================================================
*/

router.patch(
  "/admin/:id/process",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {

    try {

      const result =
        await pool.query(
          `
          UPDATE withdrawals

          SET status = 'processing'

          WHERE id = $1

            AND status = 'pending'

          RETURNING *
          `,
          [req.params.id]
        );


      if (result.rows.length === 0) {

        return res.status(404).json({
          success: false,
          message:
            "Withdrawal not found or already processed"
        });

      }


      res.json({
        success: true,
        message:
          "Withdrawal marked as processing",
        withdrawal:
          result.rows[0]
      });


    } catch (error) {

      console.error(error);

      res.status(500).json({
        success: false,
        message:
          "Unable to process withdrawal"
      });

    }

  }
);


/*
==================================================
ADMIN — COMPLETE WITHDRAWAL
==================================================
*/

router.patch(
  "/admin/:id/complete",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {

    const client = await pool.connect();

    try {

      await client.query("BEGIN");


      const result =
        await client.query(
          `
          UPDATE withdrawals

          SET
            status = 'completed',
            processed_at = NOW()

          WHERE id = $1

            AND status = 'processing'

          RETURNING *
          `,
          [req.params.id]
        );


      if (result.rows.length === 0) {

        await client.query("ROLLBACK");

        return res.status(404).json({
          success: false,
          message:
            "Withdrawal not found or not processing"
        });

      }


      const withdrawal =
        result.rows[0];


      await client.query(
        `
        INSERT INTO transactions
        (
          user_id,
          type,
          amount,
          reference_id,
          description,
          status
        )
        VALUES
        (
          $1,
          'withdrawal',
          $2,
          $3,
          'Worker withdrawal',
          'completed'
        )
        `,
        [
          withdrawal.user_id,
          -Number(withdrawal.amount),
          withdrawal.id
        ]
      );


      await client.query(
        `
        INSERT INTO notifications
        (
          user_id,
          title,
          message
        )
        VALUES
        (
          $1,
          'Withdrawal Completed',
          $2
        )
        `,
        [
          withdrawal.user_id,
          `Your withdrawal of \$${Number(
            withdrawal.amount
          ).toFixed(2)} has been completed.`
        ]
      );


      await client.query("COMMIT");


      res.json({
        success: true,
        message:
          "Withdrawal completed"
      });


    } catch (error) {

      await client.query("ROLLBACK");

      console.error(error);

      res.status(500).json({
        success: false,
        message:
          "Unable to complete withdrawal"
      });

    } finally {

      client.release();

    }

  }
);


/*
==================================================
ADMIN — REJECT WITHDRAWAL
==================================================
*/

router.patch(
  "/admin/:id/reject",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {

    try {

      const result =
        await pool.query(
          `
          UPDATE withdrawals

          SET
            status = 'rejected',
            processed_at = NOW()

          WHERE id = $1

            AND status IN (
              'pending',
              'processing'
            )

          RETURNING *
          `,
          [req.params.id]
        );


      if (result.rows.length === 0) {

        return res.status(404).json({
          success: false,
          message:
            "Withdrawal not found or already completed"
        });

      }


      res.json({
        success: true,
        message:
          "Withdrawal rejected"
      });


    } catch (error) {

      console.error(error);

      res.status(500).json({
        success: false,
        message:
          "Unable to reject withdrawal"
      });

    }

  }
);


export default router;