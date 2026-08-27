import pool from "../src/db.js";

async function seedTestData() {
  try {
    const admin = await pool.query(
      `SELECT id FROM users WHERE email = $1 LIMIT 1`,
      ["admin@taskora.com"]
    );

    if (admin.rows.length === 0) {
      throw new Error("Admin account does not exist. Run npm run seed first.");
    }

    const creatorId = admin.rows[0].id;

    const tasks = [
      {
        title: "Follow Instagram Account",
        description: "Follow the specified account and submit proof.",
        type: "social",
        language: "English",
        reward: 0.40,
        limit: 100
      },
      {
        title: "Customer Experience Survey",
        description: "Complete a short customer experience survey.",
        type: "survey",
        language: "English",
        reward: 0.75,
        limit: 100
      },
      {
        title: "Test a Website",
        description: "Test selected website features and submit feedback.",
        type: "website",
        language: "English",
        reward: 1.20,
        limit: 100
      }
    ];

    for (const task of tasks) {
      await pool.query(
        `INSERT INTO tasks
          (creator_id, title, type, description, language,
           reward_per_worker, worker_limit, completed_workers,
           reward_pool, taskora_fee, total_funding, status)
         SELECT $1, $2, $3, $4, $5, $6, $7, 0,
                $6 * $7, ($6 * $7) * 0.10, ($6 * $7) * 1.10, 'active'
         WHERE NOT EXISTS (
           SELECT 1 FROM tasks WHERE title = $2
         )`,
        [
          creatorId,
          task.title,
          task.type,
          task.description,
          task.language,
          task.reward,
          task.limit
        ]
      );
    }

    console.log("TASKORA test tasks prepared.");
  } catch (error) {
    console.error("Seed error:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seedTestData();
