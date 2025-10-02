export default function handler(req, res) {
  res.json({ 
    message: "Root endpoint - API is running!",
    endpoints: [
      "/api/hello",
      "/api/download?url=YOUTUBE_URL"
    ]
  });
}