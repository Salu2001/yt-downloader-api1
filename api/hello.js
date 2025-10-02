export default function handler(req, res) {
  res.status(200).json({ 
    message: "Hello World!",
    status: "API is working",
    timestamp: new Date().toISOString()
  });
}