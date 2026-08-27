import { pool } from "../config/database.js";


export async function getPlatformSettings() {

  const result = await pool.query(`
    SELECT
      fee_rate,
      currency,
      minimum_withdrawal
    FROM platform_settings
    ORDER BY id
    LIMIT 1
  `);


  if (result.rows.length === 0) {

    throw new Error(
      "Platform finance settings not configured"
    );

  }


  return result.rows[0];

}


export function calculateTaskFinance(
  fundingAmount,
  feeRate
) {

  const funding =
    Number(fundingAmount);

  const rate =
    Number(feeRate);


  if (
    !Number.isFinite(funding) ||
    funding <= 0
  ) {

    throw new Error(
      "Invalid funding amount"
    );

  }


  if (
    !Number.isFinite(rate) ||
    rate < 0 ||
    rate > 1
  ) {

    throw new Error(
      "Invalid fee rate"
    );

  }


  const platformFee =
    Number(
      (funding * rate).toFixed(2)
    );


  const rewardPool =
    Number(
      (funding - platformFee).toFixed(2)
    );


  return {

    fundingAmount: funding,

    platformFee,

    rewardPool

  };

}