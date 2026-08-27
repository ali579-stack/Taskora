import express from "express";
import { pool } from "../config/database.js";

const router = express.Router();

router.get("/platform", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT currency, minimum_withdrawal
      FROM platform_settings
      ORDER BY id
      LIMIT 1
      `
    );

    res.json({
      success: true,
      settings: result.rows[0]
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Unable to load settings"
    });
  }
});

export default router;
