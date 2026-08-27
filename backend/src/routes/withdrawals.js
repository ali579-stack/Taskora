/* =========================================================
   TASKORA WITHDRAWAL ROUTES
   ========================================================= */

import express from "express";

import pool from "../db.js";

import {
  authenticate
} from "../middleware/auth.js";


const router = express.Router();



/*
  CREATE WITHDRAWAL REQUEST
*/

router.post(
  "/",
  authenticate,
  async(req,res)=>{

    const client =
      await pool.connect();


    try {

      const {
        amount,
        method,
        account
      } = req.body;



      const withdrawalAmount =
        Number(amount);



      if(
        !Number.isFinite(
          withdrawalAmount
        ) ||
        withdrawalAmount <= 0
      ){

        return res.status(400).json({

          message:
          "Invalid amount"

        });

      }



      await client.query(
        "BEGIN"
      );



      const userResult =
        await client.query(
          `
          SELECT balance
          FROM users
          WHERE id=$1
          FOR UPDATE
          `,
          [
            req.user.id
          ]
        );



      if(
        userResult.rows.length===0
      ){

        throw new Error(
          "User not found"
        );

      }



      const balance =
        Number(
          userResult.rows[0].balance
        );



      if(
        withdrawalAmount > balance
      ){

        throw new Error(
          "Insufficient balance"
        );

      }




      const withdrawal =
        await client.query(
          `
          INSERT INTO withdrawals
          (
            worker_id,
            amount,
            method,
            account
          )

          VALUES
          ($1,$2,$3,$4)

          RETURNING *

          `,
          [
            req.user.id,
            withdrawalAmount,
            method,
            account
          ]
        );




      await client.query(
        `
        UPDATE users

        SET balance =
        balance - $1

        WHERE id=$2

        `,
        [
          withdrawalAmount,
          req.user.id
        ]
      );



      await client.query(
        "COMMIT"
      );



      res.json({

        success:true,

        withdrawal:
        withdrawal.rows[0]

      });



    }catch(error){


      await client.query(
        "ROLLBACK"
      );


      res.status(400).json({

        message:
        error.message

      });



    }finally{

      client.release();

    }


  }
);






/*
  WORKER WITHDRAWAL HISTORY
*/

router.get(
  "/",
  authenticate,
  async(req,res)=>{

    try {


      const result =
        await pool.query(
          `

          SELECT *

          FROM withdrawals

          WHERE worker_id=$1

          ORDER BY created_at DESC

          `,
          [
            req.user.id
          ]
        );



      res.json({

        withdrawals:
        result.rows

      });



    }catch(error){


      res.status(500).json({

        message:
        error.message

      });


    }


  }
);




export default router;