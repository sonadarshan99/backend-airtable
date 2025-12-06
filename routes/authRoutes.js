const express = require("express");
const axios = require("axios");
const crypto = require("crypto");
const router = express.Router();
const User = require("../models/User");
function base64URLEncode(str) {
  return str.toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}
function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest();
}

router.get("/airtable", (req, res) => {

  const state = crypto.randomBytes(16).toString("hex");
  

  const codeVerifier = base64URLEncode(crypto.randomBytes(32));
  const codeChallenge = base64URLEncode(sha256(codeVerifier));


  const cookieOptions = { httpOnly: true, sameSite: "lax", maxAge: 600000 };
  res.cookie("oauth_state", state, cookieOptions);
  res.cookie("oauth_code_verifier", codeVerifier, cookieOptions);


  const scopes = "data.records:read data.records:write schema.bases:read";
  
  const queryParams = [
    `response_type=code`,
    `client_id=${process.env.AIRTABLE_CLIENT_ID}`,
    `redirect_uri=${encodeURIComponent(process.env.AIRTABLE_REDIRECT_URI)}`,
    `scope=${encodeURIComponent(scopes)}`,
    `state=${state}`,
    `code_challenge=${codeChallenge}`,
    `code_challenge_method=S256`
  ];

  const url = `https://airtable.com/oauth2/v1/authorize?${queryParams.join("&")}`;

  console.log("Redirecting to Airtable:", url);
  res.redirect(url);
});


router.get("/callback", async (req, res) => {
  console.log("Callback received:", req.query);

  const { code, state, error, error_description } = req.query;

  if (error) {
    return res.status(400).send(`Airtable Error: ${error_description || error}`);
  }

  if (!state || state !== req.cookies?.oauth_state) {
    return res.status(400).send("Error: State mismatch. Please try logging in again.");
  }

  if (!code) {
    return res.status(400).send("Error: No code received.");
  }

  const codeVerifier = req.cookies?.oauth_code_verifier;
  if (!codeVerifier) {
    return res.status(400).send("Error: Code verifier cookie missing.");
  }

  try {
    const tokenParams = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.AIRTABLE_REDIRECT_URI,
      client_id: process.env.AIRTABLE_CLIENT_ID,
      code_verifier: codeVerifier
    });
    const headers = { "Content-Type": "application/x-www-form-urlencoded" };
    if (process.env.AIRTABLE_CLIENT_SECRET) {
      const auth = Buffer.from(`${process.env.AIRTABLE_CLIENT_ID}:${process.env.AIRTABLE_CLIENT_SECRET}`).toString("base64");
      headers.Authorization = `Basic ${auth}`;
    }

    const tokenRes = await axios.post(
      "https://airtable.com/oauth2/v1/token",
      tokenParams,
      { headers }
    );

    const { access_token, refresh_token } = tokenRes.data;

    const profile = await axios.get("https://api.airtable.com/v0/meta/whoami", {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    let user = await User.findOne({ airtableId: profile.data?.id });
    if (!user) user = new User({ airtableId: profile.data?.id });

    user.accessToken = access_token;
    user.refreshToken = refresh_token;
    user.profile = profile.data;
    user.lastLoginAt = new Date();
    await user.save();

    res.cookie("userId", user._id.toString(), { httpOnly: true, sameSite: "lax" });
    res.redirect(process.env.FRONTEND_URL);

  } catch (err) {
    console.error("Token Exchange Error:", err.response?.data || err.message);
    res.status(500).json({ error: "Authentication failed", details: err.response?.data });
  }
});

module.exports = router;