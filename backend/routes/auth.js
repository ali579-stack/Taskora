import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../db.js";
import { loginLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();



router.post("/register", async (req, res) => {

  try {

    const {
      name,
      email,
      password
    } = req.body;


    const passwordHash =
      await bcrypt.hash(
        password,
        12
      );


    const result =
      await pool.query(
        `
        INSERT INTO users
        (
          name,
          email,
          password_hash
        )
        VALUES
        ($1,$2,$3)
        RETURNING id,name,email,role
        `,
        [
          name,
          email,
          passwordHash
        ]
      );


    res.json({
      success:true,
      user:result.rows[0]
    });


  } catch(error){

    res.status(500).json({
      message:error.message
    });

  }

});





router.post("/login", loginLimiter, async (req,res)=>{

  try {

    const {
      email,
      password
    } = req.body;


    const result =
      await pool.query(
        `
        SELECT *
        FROM users
        WHERE email=$1
        `,
        [email]
      );


    if(
      result.rows.length===0
    ){

      return res
      .status(401)
      .json({
        message:"Invalid login"
      });

    }


    const user =
      result.rows[0];


    const valid =
      await bcrypt.compare(
        password,
        user.password_hash
      );


    if(!valid){

      return res
      .status(401)
      .json({
        message:"Invalid login"
      });

    }



    const token =
      jwt.sign(
        {
          id:user.id,
          role:user.role
        },
        process.env.JWT_SECRET,
        {
          expiresIn:"7d"
        }
      );



    res.json({

      token,

      user:{
        id:user.id,
        name:user.name,
        email:user.email,
        role:user.role
      }

    });


  } catch(error){

    res.status(500).json({
      message:error.message
    });

  }

});



export default router;