const CensusService = require('../services/censusService');
//const pool = require('../config/db'); // aapka mysql connection pool
const { pool } = require('../config/mysql');
const censusService = new CensusService(pool);

const importData = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'कृपया .xlsx या .csv फ़ाइल अपलोड करें।',
      });
    }

    const result = await censusService.importCensusBuffer(
      req.file.buffer,
      req.file.originalname
    );

    return res.status(200).json({
      success: true,
      message: 'जनगणना डेटा सफलतापूर्वक इम्पोर्ट हो गया।',
      data: result,
    });
  } catch (error) {
    console.error('Import Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'इम्पोर्ट करने में त्रुटि आई।',
    });
  }
};

const exportData = async (req, res) => {
  try {
    const format = (req.query.format || 'xlsx').toLowerCase();
    const buffer = await censusService.exportCensusBuffer(format);

    const timestamp = new Date().toISOString().split('T')[0];

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="Census_Data_${timestamp}.csv"`
      );
    } else {
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="Census_Data_${timestamp}.xlsx"`
      );
    }

    return res.send(buffer);
  } catch (error) {
    console.error('Export Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'फ़ाइल एक्सपोर्ट करने में विफल।',
    });
  }
};

module.exports = {
  importData,
  exportData,
};