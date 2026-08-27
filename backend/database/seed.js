import bcrypt from "bcryptjs";
import pool from "../src/db.js";


async function seed() {

  try {

    const passwordHash =
      await bcrypt.hash(
        "ChangeThisAdminPassword123!",
        12
      );


    await pool.query(
      `
      INSERT INTO users
      (
        name,
        email,
        password_hash,
        role
      )

      VALUES
      ($1,$2,$3,$4)

      ON CONFLICT(email)
      DO NOTHING
      `,
      [
        "TASKORA Admin",
        "admin@taskora.com",
        passwordHash,
        "admin"
      ]
    );


    console.log(
      "Admin account created"
    );


    process.exit();


  } catch(error) {

    console.error(error);

    process.exit(1);

  }

}


seed();