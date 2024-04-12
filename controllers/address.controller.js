const { pool, poolPromise } = require("../database/dbinfo");
const NodeCache = require("node-cache");
const cache = new NodeCache();
const { pool } = require("../database/dbinfo");


const getWards = (req, res) => {
  const { province_id,district_id } = req.body;
  pool.query(
    "SELECT id, name FROM res_ward WHERE district_id = $1 and province_id = $2",
    [district_id,province_id],
    (err, result) => {
      if (err) {
        res.status(500).send(err);
      } else {
        res.status(200).json(result.rows);
      }
    }
  );
};

const getDistricts = async (req, res) => {
  const { province_id } = req.params;

  try {
    const result = await pool.query(
      "SELECT district_id, name FROM res_district WHERE province_id = $1",
      [province_id]
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error getting districts:", err);
    return res.status(500).json({ error: "Lỗi máy chủ" });
  }
};

const getProvinces = async (req, res) => {
  try {
    const result = await pool.query("SELECT id,name  from res_province");

    res.status(200).json(result);
  } catch (err) {
    console.error("Error getting districts:", err);
    return res.status(500).json({ error: "Lỗi máy chủ" });
  }
};

module.exports = { getWards, getDistricts, getProvinces };
