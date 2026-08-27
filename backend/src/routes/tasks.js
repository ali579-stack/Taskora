/* =========================================================
   TASKORA TASK ROUTES
   ========================================================= */

import express from "express";
import pool from "../db.js";
import {
  authenticate
} from "../middleware/auth.js";


const router = express.Router();



/*
  GET ALL ACTIVE TASKS
*/

router.get(
  "/",
  authenticate,
  async (req,res)=>{

    try {

      const result =
        await pool.query(
          `
          SELECT
            id,
            title,
            description,
            category,
            reward,
            created_at
          FROM tasks
          WHERE status='active'
          ORDER BY created_at DESC
          `
        );


      res.json({
        tasks: result.rows
      });


    } catch(error){

      res.status(500).json({
        message:error.message
      });

    }

  }
);





/*
  GET SINGLE TASK
*/

router.get(
  "/:id",
  authenticate,
  async(req,res)=>{

    try {

      const result =
        await pool.query(
          `
          SELECT *
          FROM tasks
          WHERE id=$1
          `,
          [
            req.params.id
          ]
        );


      if(
        result.rows.length===0
      ){

        return res.status(404).json({
          message:"Task not found"
        });

      }


      res.json({
        task:result.rows[0]
      });


    }catch(error){

      res.status(500).json({
        message:error.message
      });

    }

  }
);





/*
  SUBMIT TASK PROOF
*/

router.post(
  "/:id/submit",
  authenticate,
  async(req,res)=>{


    try {


      const {
        proof
      } = req.body;



      const task =
        await pool.query(
          `
          SELECT *
          FROM tasks
          WHERE id=$1
          AND status='active'
          `,
          [
            req.params.id
          ]
        );



      if(
        task.rows.length===0
      ){

        return res.status(404).json({
          message:"Task unavailable"
        });

      }



      const result =
        await pool.query(
          `
          INSERT INTO submissions
          (
            task_id,
            worker_id,
            proof
          )
          VALUES
          ($1,$2,$3)
          RETURNING *
          `,
          [
            req.params.id,
            req.user.id,
            proof || ""
          ]
        );



      res.json({

        success:true,

        submission:
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