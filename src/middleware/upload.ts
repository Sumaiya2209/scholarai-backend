import multer from "multer";

// Memory storage: we need the raw buffer to (1) extract PDF text and
// (2) stream to Cloudinary, without writing temp files to disk.
const storage = multer.memoryStorage();

export const uploadPdf = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB cap
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are allowed"));
    }
    cb(null, true);
  },
});
