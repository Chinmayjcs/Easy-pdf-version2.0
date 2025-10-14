// server.js
import express from "express";
import multer from "multer";
import fs from "fs";
import PDFMerger from "pdf-merger-js";

const app = express();
const port = process.env.PORT || 3000;

// Serve static files (CSS/JS)
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

// Configure upload folder
const upload = multer({ dest: "uploads/" });

// Homepage
app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Merge route
app.post("/merge", upload.array("pdfs", 10), async (req, res) => {
  try {
    const merger = new PDFMerger();

    for (let file of req.files) {
      await merger.add(file.path);
    }

    const outputPath = `merged/merged_${Date.now()}.pdf`;
    await merger.save(outputPath);

    // Clean up uploaded files
    req.files.forEach(f => fs.unlinkSync(f.path));

    res.download(outputPath, (err) => {
      if (!err) fs.unlinkSync(outputPath); // Delete after download
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error merging PDFs");
  }
});

// Ensure required folders exist (useful on cloud providers with clean filesystems)
["uploads", "merged", "public", "views"].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

app.listen(port, () => console.log(` Server running at http://localhost:${port}`));
