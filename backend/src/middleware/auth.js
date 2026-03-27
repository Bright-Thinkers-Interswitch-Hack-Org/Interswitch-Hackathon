import jwt from "jsonwebtoken";

export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    console.log(`   [AUTH] Auth rejected: no token on ${req.method} ${req.originalUrl}`);
    return res.status(401).json({ error: "Missing or invalid token" });
  }

  try {
    const token = header.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, email }
    next();
  } catch (err) {
    console.log(`   [AUTH] Auth rejected: invalid token on ${req.method} ${req.originalUrl} — ${err.message}`);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
