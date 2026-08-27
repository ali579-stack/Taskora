import express from "express";

import { pool } from "../config/database.js";
import {
  requireAuth,
  requireRole
} from "../middleware/auth.js";

const router = express.Router();


/*
  GET AVAILABLE TASKS
  Workers only
*/

router.get(
  "/available",
  requireAuth,
  requireRole("worker"),
  async (req, res) => {

    try {

      const result = await pool.query(`
        SELECT
          id,
          title,
          type,
          description,
          language,
          reward_per_worker,
          worker_limit,
          completed_workers,
          status,
          created_at
        FROM tasks
        WHERE status = 'active'
          AND completed_workers < worker_limit
        ORDER BY created_at DESC
      `);


      res.json({
        success: true,
        tasks: result.rows
      });


    } catch (error) {

      console.error(error);

      res.status(500).json({
        success: false,
        message: "Unable to load tasks"
      });

    }

  }
);


/*
  GET TRUSTED USER'S TASKS
*/

router.get(
  "/mine",
  requireAuth,
  requireRole("trusted_user"),
  async (req, res) => {

    try {

      const result = await pool.query(
        `
        SELECT *
        FROM tasks
        WHERE creator_id = $1
        ORDER BY created_at DESC
        `,
        [req.user.id]
      );


      res.json({
        success: true,
        tasks: result.rows
      });


    } catch (error) {

      console.error(error);

      res.status(500).json({
        success: false,
        message: "Unable to load your tasks"
      });

    }

  }
);


/*
  CREATE TASK
  Trusted User
*/

router.post(
  "/",
  requireAuth,
  requireRole("trusted_user"),
  async (req, res) => {

    const client = await pool.connect();

    try {

      const {
        title,
        type,
        description,
        language = "en",
        rewardPerWorker,
        workerLimit
      } = req.body;


      if (
        !title ||
        !type ||
        !description ||
        !rewardPerWorker ||
        !workerLimit
      ) {

        return res.status(400).json({
          success: false,
          message: "All task fields are required"
        });

      }


      const reward =
        Number(rewardPerWorker);

      const workers =
        Number(workerLimit);


      if (
        !Number.isFinite(reward) ||
        !Number.isFinite(workers) ||
        reward <= 0 ||
        workers <= 0 ||
        !Number.isInteger(workers)
      ) {

        return res.status(400).json({
          success: false,
          message: "Invalid reward or worker quantity"
        });

      }


      /*
        Get platform settings
      */

      const settingsResult =
        await client.query(`
          SELECT key, value
          FROM platform_settings
          WHERE key IN (
            'taskora_fee_percent',
            'minimum_worker_reward',
            'maximum_worker_reward'
          )
        `);


      const settings = {};


      for (
        const row of settingsResult.rows
      ) {

        settings[row.key] =
          Number(row.value);

      }


      const feePercent =
        settings.taskora_fee_percent ?? 10;

      const minimumReward =
        settings.minimum_worker_reward ?? 0.10;

      const maximumReward =
        settings.maximum_worker_reward ?? 100;


      /*
        Validate reward against
        Admin settings.
      */

      if (
        reward < minimumReward ||
        reward > maximumReward
      ) {

        return res.status(400).json({
          success: false,
          message:
            `Reward must be between \$${minimumReward} and \$${maximumReward}`
        });

      }


      /*
        MONEY CALCULATION

        Reward Pool =
        reward × workers

        TASKORA Fee =
        pool × fee%

        Total =
        pool + fee
      */

      const rewardPool =
        reward * workers;

      const taskoraFee =
        rewardPool *
        (feePercent / 100);

      const totalFunding =
        rewardPool +
        taskoraFee;


      await client.query("BEGIN");


      const result =
        await client.query(
          `
          INSERT INTO tasks
          (
            creator_id,
            title,
            type,
            description,
            language,
            reward_per_worker,
            worker_limit,
            reward_pool,
            taskora_fee,
            total_funding,
            status
          )
          VALUES
          (
            $1,$2,$3,$4,$5,
            $6,$7,$8,$9,$10,
            'pending_review'
          )
          RETURNING *
          `,
          [
            req.user.id,
            title,
            type,
            description,
            language,
            reward,
            workers,
            rewardPool,
            taskoraFee,
            totalFunding
          ]
        );


      await client.query("COMMIT");


      res.status(201).json({
        success: true,
        message:
          "Task created and sent for review",

        task: result.rows[0]
      });


    } catch (error) {

      await client.query("ROLLBACK");

      console.error(error);

      res.status(500).json({
        success: false,
        message: "Unable to create task"
      });


    } finally {

      client.release();

    }

  }
);


/*
  GET SINGLE TASK
*/

router.get(
  "/:id",
  requireAuth,
  async (req, res) => {

    try {

      const result =
        await pool.query(
          `
          SELECT *
          FROM tasks
          WHERE id = $1
          `,
          [req.params.id]
        );


      if (result.rows.length === 0) {

        return res.status(404).json({
          success: false,
          message: "Task not found"
        });

      }


      const task = result.rows[0];


      /*
        Do not expose internal
        funding details unnecessarily
        to workers.
      */

      if (
        req.user.role === "worker" &&
        task.status !== "active"
      ) {

        return res.status(404).json({
          success: false,
          message: "Task not available"
        });

      }


      res.json({
        success: true,
        task
      });


    } catch (error) {

      console.error(error);

      res.status(500).json({
        success: false,
        message: "Unable to load task"
      });

    }

  }
);


export default router;
