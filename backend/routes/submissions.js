import express from "express";
import { pool } from "../config/database.js";

import {
  requireAuth,
  requireRole
} from "../middleware/auth.js";

const router = express.Router();


/*
==================================================
WORKER — SUBMIT TASK
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
        taskId,
        proof = null
      } = req.body;

      if (!taskId) {
        return res.status(400).json({
          success: false,
          message: "Task ID is required"
        });
      }

      await client.query("BEGIN");


      const taskResult = await client.query(
        `
        SELECT *
        FROM tasks
        WHERE id = $1
        FOR UPDATE
        `,
        [taskId]
      );


      if (taskResult.rows.length === 0) {

        await client.query("ROLLBACK");

        return res.status(404).json({
          success: false,
          message: "Task not found"
        });
      }


      const task = taskResult.rows[0];


      if (task.status !== "active") {

        await client.query("ROLLBACK");

        return res.status(400).json({
          success: false,
          message: "Task is not active"
        });
      }


      if (
        task.completed_workers >=
        task.worker_limit
      ) {

        await client.query("ROLLBACK");

        return res.status(400).json({
          success: false,
          message: "Task is full"
        });
      }


      const existing = await client.query(
        `
        SELECT id
        FROM submissions
        WHERE task_id = $1
          AND worker_id = $2
        `,
        [
          taskId,
          req.user.id
        ]
      );


      if (existing.rows.length > 0) {

        await client.query("ROLLBACK");

        return res.status(409).json({
          success: false,
          message: "You already submitted this task"
        });
      }


      const submission =
        await client.query(
          `
          INSERT INTO submissions
          (
            task_id,
            worker_id,
            proof,
            reward_amount,
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
            taskId,
            req.user.id,
            proof,
            task.reward_per_worker
          ]
        );


      await client.query(
        `
        UPDATE tasks
        SET
          completed_workers =
            completed_workers + 1,
          updated_at = NOW()
        WHERE id = $1
        `,
        [taskId]
      );


      await client.query("COMMIT");


      res.status(201).json({
        success: true,
        message: "Submission received",
        submission: submission.rows[0]
      });


    } catch (error) {

      await client.query("ROLLBACK");

      console.error(error);

      res.status(500).json({
        success: false,
        message: "Unable to submit task"
      });

    } finally {

      client.release();

    }

  }
);


/*
==================================================
WORKER — MY SUBMISSIONS
==================================================
*/

router.get(
  "/mine",
  requireAuth,
  requireRole("worker"),
  async (req, res) => {

    try {

      const result = await pool.query(
        `
        SELECT
          s.*,
          t.title,
          t.type
        FROM submissions s

        JOIN tasks t
          ON t.id = s.task_id

        WHERE s.worker_id = $1

        ORDER BY s.created_at DESC
        `,
        [req.user.id]
      );


      res.json({
        success: true,
        submissions: result.rows
      });


    } catch (error) {

      console.error(error);

      res.status(500).json({
        success: false,
        message: "Unable to load submissions"
      });

    }

  }
);


/*
==================================================
ADMIN — PENDING SUBMISSIONS
==================================================
*/

router.get(
  "/admin/pending",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {

    try {

      const result = await pool.query(
        `
        SELECT
          s.id,
          s.task_id,
          s.worker_id,
          s.proof,
          s.reward_amount,
          s.status,
          s.created_at,

          t.title AS task_title,

          p.name AS worker_name,
          p.email AS worker_email

        FROM submissions s

        JOIN tasks t
          ON t.id = s.task_id

        JOIN users p
          ON p.id = s.worker_id

        WHERE s.status = 'pending'

        ORDER BY s.created_at ASC
        `
      );


      res.json({
        success: true,
        submissions: result.rows
      });


    } catch (error) {

      console.error(error);

      res.status(500).json({
        success: false,
        message: "Unable to load pending submissions"
      });

    }

  }
);


/*
==================================================
ADMIN — APPROVE SUBMISSION
==================================================
*/

router.patch(
  "/admin/:id/approve",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {

    const client = await pool.connect();

    try {

      await client.query("BEGIN");


      /*
        Lock submission.
      */

      const submissionResult =
        await client.query(
          `
          SELECT *
          FROM submissions
          WHERE id = $1
          FOR UPDATE
          `,
          [req.params.id]
        );


      if (submissionResult.rows.length === 0) {

        await client.query("ROLLBACK");

        return res.status(404).json({
          success: false,
          message: "Submission not found"
        });
      }


      const submission =
        submissionResult.rows[0];


      if (submission.status !== "pending") {

        await client.query("ROLLBACK");

        return res.status(400).json({
          success: false,
          message:
            "Submission has already been processed"
        });
      }


      /*
        Approve submission.
      */

      await client.query(
        `
        UPDATE submissions
        SET
          status = 'approved',
          reviewed_at = NOW()
        WHERE id = $1
        `,
        [submission.id]
      );


      /*
        Create worker earning transaction.
      */

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
          'task_reward',
          $2,
          $3,
          $4,
          'completed'
        )
        `,
        [
          submission.worker_id,
          submission.reward_amount,
          submission.id,
          "Approved task reward"
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
          submission.worker_id,
          "Task Reward Approved",
          `Your task reward of €${Number(
            submission.reward_amount
          ).toFixed(2)} has been approved.`
        ]
      );


      await client.query("COMMIT");


      res.json({
        success: true,
        message:
          "Submission approved and worker rewarded"
      });


    } catch (error) {

      await client.query("ROLLBACK");

      console.error(error);

      res.status(500).json({
        success: false,
        message:
          "Unable to approve submission"
      });

    } finally {

      client.release();

    }

  }
);


/*
==================================================
ADMIN — REJECT SUBMISSION
==================================================
*/

router.patch(
  "/admin/:id/reject",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {

    const client = await pool.connect();

    try {

      await client.query("BEGIN");


      const result = await client.query(
        `
        UPDATE submissions

        SET
          status = 'rejected',
          reviewed_at = NOW()

        WHERE id = $1
          AND status = 'pending'

        RETURNING *
        `,
        [req.params.id]
      );


      if (result.rows.length === 0) {

        await client.query("ROLLBACK");

        return res.status(404).json({
          success: false,
          message:
            "Submission not found or already processed"
        });
      }


      const submission =
        result.rows[0];


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
          submission.worker_id,
          "Submission Rejected",
          "Your task submission was rejected."
        ]
      );


      await client.query("COMMIT");


      res.json({
        success: true,
        message: "Submission rejected"
      });


    } catch (error) {

      await client.query("ROLLBACK");

      console.error(error);

      res.status(500).json({
        success: false,
        message:
          "Unable to reject submission"
      });

    } finally {

      client.release();

    }

  }
);


export default router;