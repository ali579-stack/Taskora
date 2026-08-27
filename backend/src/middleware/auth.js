import jwt from "jsonwebtoken";
import pool from "../db.js";


export async function authenticate(
  req,
  res,
  next
) {

  try {

    const header =
      req.headers.authorization;


    if (!header) {

      return res.status(401).json({
        message: "Authentication required"
      });

    }


    const token =
      header.split(" ")[1];


    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );


    const result =
      await pool.query(
        `
        SELECT id,name,email,role
        FROM users
        WHERE id=$1
        `,
        [decoded.id]
      );


    if (
      result.rows.length === 0
    ) {

      return res.status(401).json({
        message:"User not found"
      });

    }


    req.user =
      result.rows[0];


    next();


  } catch(error) {

    return res.status(401).json({
      message:"Invalid token"
    });

  }

}



export function requireAdmin(
  req,
  res,
  next
) {


  if (
    !req.user ||
    req.user.role !== "admin"
  ) {

    return res.status(403).json({
      message:"Admin access required"
    });

  }


  next();

}