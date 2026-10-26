const multer = require('multer');

// Store upload in memory buffer for instant xlsx parsing
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/octet-stream',
  ];

  const hasExcelExt = file.originalname.match(/\.(xlsx|xls)$/i);

  if (allowedMimes.includes(file.mimetype) || hasExcelExt) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Please upload an Excel spreadsheet (.xlsx or .xls).'), false);
  }
};

const uploadExcel = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter,
});

module.exports = {
  uploadExcel,
};
