const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");

const appleJwks = jwksClient({
  jwksUri: "https://appleid.apple.com/auth/keys",
  cache: true,
  rateLimit: true,
});

async function verifyGoogleIdToken(idToken) {
  const raw = (process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_IDS || "").trim();
  if (!raw) throw new Error("GOOGLE_CLIENT_ID is not configured.");
  const audiences = raw.split(",").map((s) => s.trim()).filter(Boolean);
  const client = new OAuth2Client();
  const ticket = await client.verifyIdToken({ idToken, audience: audiences.length === 1 ? audiences[0] : audiences });
  const p = ticket.getPayload();
  if (!p || !p.sub) throw new Error("Invalid Google token payload.");
  if (!p.email) throw new Error("Google token missing email scope.");
  return {
    sub: p.sub,
    email: p.email,
    emailVerified: Boolean(p.email_verified),
    name: p.name || "",
  };
}

function getAppleSigningKey(header, callback) {
  appleJwks.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

async function verifyAppleIdToken(idToken) {
  const clientId = (process.env.APPLE_CLIENT_ID || "").trim();
  if (!clientId) throw new Error("APPLE_CLIENT_ID is not configured.");
  return new Promise((resolve, reject) => {
    jwt.verify(
      idToken,
      getAppleSigningKey,
      { algorithms: ["RS256"], audience: clientId, issuer: "https://appleid.apple.com" },
      (err, decoded) => {
        if (err) return reject(err);
        if (!decoded || !decoded.sub) return reject(new Error("Invalid Apple token."));
        const email = decoded.email;
        if (!email && !decoded.sub) return reject(new Error("Apple token missing identity."));
        resolve({
          sub: decoded.sub,
          email: email || null,
          emailVerified: true,
          name: "",
        });
      }
    );
  });
}

module.exports = { verifyGoogleIdToken, verifyAppleIdToken };
