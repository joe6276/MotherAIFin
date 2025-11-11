const sql = require("mssql");
const { sqlConfig } = require("../config");

async function insertMessage(role, content, userId) {
    console.log("called DB");
    
  try {
    const pool = await sql.connect(sqlConfig);
    await pool.request()
      .input('content', sql.NVarChar, content)
      .input('role', sql.NVarChar, role)
      .input('userId', sql.Int, userId)
      .query(`
        INSERT INTO Messages (content, role, userId)
        VALUES (@content, @role, @userId)
      `);
  
  } catch (err) {
    throw new Error(err)
  } finally {
    sql.close();
  }
}


async function getLast10Messages(userId) {
       console.log("called DB @");
  try {
    const pool = await sql.connect(sqlConfig);
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT TOP 10 role, content
        FROM Messages
        WHERE userId = @userId
        ORDER BY Id DESC
      `);

    return result.recordset;
  } catch (err) {
   throw new Error(err)
  } finally {
    sql.close();
  }
}



module.exports={insertMessage, getLast10Messages}