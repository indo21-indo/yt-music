const express = require("express");
const path = require("path");
const fs = require("fs");
const ytdl = require("ytdl-core");
const Youtube = require("youtube-search-api");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

app.post("/api/search", async (req, res) => {
  const { keyword } = req.body;
  if (!keyword) return res.status(400).json({ success: false, error: "Keyword missing" });

  try {
    const results = await Youtube.GetListByKeyword(keyword, false, 6);
    const videos = results.items.filter(i => i.type === "video").map((v, i) => ({
      index: i + 1,
      id: v.id,
      title: v.title,
      duration: v.length.simpleText
    }));
    res.json({ success: true, videos });
  } catch (e) {
    res.status(500).json({ success: false, error: "Search failed" });
  }
});

app.post("/api/download", async (req, res) => {
  const { link } = req.body;
  if (!link || !ytdl.validateURL(link)) {
    return res.status(400).json({ success: false, error: "Invalid YouTube URL" });
  }

  const filePath = path.join(__dirname, "..", "public", "downloads", "song.mp3");
  if (!fs.existsSync(path.dirname(filePath))) fs.mkdirSync(path.dirname(filePath));

  try {
    const info = await ytdl.getInfo(link);
    const stream = ytdl(link, {
      filter: f => f.hasAudio && f.audioBitrate === 48
    });
    stream.pipe(fs.createWriteStream(filePath)).on("finish", () => {
      res.json({
        success: true,
        title: info.videoDetails.title,
        author: info.videoDetails.author.name,
        duration: info.videoDetails.lengthSeconds,
        views: info.videoDetails.viewCount,
        file: "/downloads/song.mp3"
      });
    });
  } catch (e) {
    res.status(500).json({ success: false, error: "Download failed" });
  }
});
//
// Static ফাইল serve করার জন্য public ফোল্ডার
app.use(express.static(path.join(__dirname, 'public')));

// যদি ইউজার '/' (root) এ যাক, তাহলে index.html পাঠাবে
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
