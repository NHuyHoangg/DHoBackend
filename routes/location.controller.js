"use strict";
const districts = require("../models/district")
const wards = require("../models/ward")

const getDistricts = async (req, res) => {
    res.json(districts);
}

const getWards = async (req, res) => {
    // console.log(req.params.id)
    const wardOfDistrict = wards[+req.params.id + 1];
    // console.log(wards)
    // console.log(wardOfDistrict)
    if (!wardOfDistrict) res.status(404).json({message: "Cannot find wards of the given district, check your district id"})
    else res.json(wardOfDistrict);
}

module.exports = {
  getDistricts,
  getWards
};
