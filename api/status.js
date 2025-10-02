module.exports = async (req, res) => {
  res.json({ 
    status: "OK",
    message: "API is working!",
    repository: "yt-downloader-api1",
    timestamp: new Date().toISOString()
  });
};
