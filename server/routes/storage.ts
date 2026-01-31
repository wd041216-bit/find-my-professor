import express from "express";
import multer from "multer";
import { storagePut } from "../storage";
import { nanoid } from "nanoid";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 16 * 1024 * 1024, // 16MB limit
  },
});

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileExtension = req.file.originalname.split(".").pop();
    const fileKey = `resumes/${nanoid()}.${fileExtension}`;
    
    const { url } = await storagePut(
      fileKey,
      req.file.buffer,
      req.file.mimetype
    );

    res.json({ url, key: fileKey });
  } catch (error) {
    console.error("Storage upload error:", error);
    res.status(500).json({ error: "Failed to upload file" });
  }
});

export default router;
