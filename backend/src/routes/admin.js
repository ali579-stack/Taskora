/* =========================================================
   TASKORA ADMIN ROUTES
   ========================================================= */

import express from "express";

import pool from "../db.js";

import {
  authenticate,
  requireAdmin
} from "../middleware/auth.js";


const router = express.Router();



/*
  All admin routes require:
  - valid login token
  - admin role
*/

router.use(
  authenticate,
  requireAdmin
);



/*
  CREATE TASK
*/

router.post(
  "/tasks",
  async (req,res)=>{

    try {

      const {
        title,
        description,
        category,
        reward
      } = req.body;


      const result =
        await pool.query(
          `
          INSERT INTO tasks
          (
            title,
            description,
            category,
            reward,
            created_by
          )
          VALUES
          ($1,$2,$3,$4,$5)
          RETURNING *
          `,
          [
            title,
            description,
            category,
            reward,
            req.user.id
          ]
        );


      res.json({
        success:true,
        task:result.rows[0]
      });


    } catch(error){

      res.status(500).json({
        message:error.message
      });

    }

  }
);





/*
  VIEW SUBMISSIONS
*/

router.get(
  "/submissions",
  async(req,res)=>{

    try {

      const result =
        await pool.query(
          `
          SELECT

          submissions.id,

          submissions.status,

          submissions.proof,

          submissions.reward,

          users.name AS worker,

          tasks.title AS task


          FROM submissions


          JOIN users
          ON users.id=submissions.worker_id


          JOIN tasks
          ON tasks.id=submissions.task_id


          ORDER BY submissions.submitted_at DESC

          `
        );


      res.json({
        submissions:
          result.rows
      });


    }catch(error){

      res.status(500).json({
        message:error.message
      });

    }

  }
);





/*
  APPROVE SUBMISSION
  Adds reward to worker balance
*/

router.patch(
  "/submissions/:id/approve",
  async(req,res)=>{

    const client =
      await pool.connect();


    try {

      await client.query(
        "BEGIN"
      );



      const submission =
        await client.query(
          `
          SELECT *
          FROM submissions
          WHERE id=$1
          `,
          [
            req.params.id
          ]
        );



      if(
        submission.rows.length===0
      ){

        throw new Error(
          "Submission not found"
        );

      }



      const data =
        submission.rows[0];



      await client.query(
        `
        UPDATE submissions
        SET status='approved'
        WHERE id=$1
        `,
        [
          req.params.id
        ]
      );



      await client.query(
        `
        UPDATE users
        SET

        balance =
        balance + $1,

        total_earnings =
        total_earnings + $1

        WHERE id=$2

        `,
        [
          data.reward,
          data.worker_id
        ]
      );



      await client.query(
        "COMMIT"
      );



      res.json({
        success:true
      });



    }catch(error){

      await client.query(
        "ROLLBACK"
      );


      res.status(500).json({
        message:error.message
      });


    }finally{

      client.release();

    }


  }
);





/*
  GET WITHDRAWALS
*/

router.get(
  "/withdrawals",
  async(req,res)=>{

    try {


      const result =
        await pool.query(
          `

          SELECT

          withdrawals.*,

          users.name AS workerName


          FROM withdrawals


          JOIN users

          ON users.id =
          withdrawals.worker_id


          ORDER BY created_at DESC

          `
        );


      res.json({

        withdrawals:
          result.rows

      });



    }catch(error){

      res.status(500).json({
        message:error.message
      });

    }


  }
);





/*
  UPDATE WITHDRAWAL STATUS
*/

router.patch(
  "/withdrawals/:id",
  async(req,res)=>{

    try {

      const {
        status
      } = req.body;



      const result =
        await pool.query(
          `
          UPDATE withdrawals

          SET

          status=$1,

          processed_at=
          CURRENT_TIMESTAMP


          WHERE id=$2


          RETURNING *

          `,
          [
            status,
            req.params.id
          ]
        );



      res.json({

        success:true,

        withdrawal:
          result.rows[0]

      });


    }catch(error){

      res.status(500).json({
        message:error.message
      });

    }


  }
);



export default router;