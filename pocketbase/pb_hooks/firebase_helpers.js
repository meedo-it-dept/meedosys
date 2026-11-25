// =============================================================================
// MEEDOSys v2.0 - PocketBase Firebase Verification & Audit Helpers
// Loaded inside each isolated Goja JSVM callback via require(...)
// =============================================================================

function loadFirebaseConfig() {
  var projectId = "";
  var apiKey = "";
  try {
    projectId = String($os.getenv("FIREBASE_PROJECT_ID") || "").trim();
    apiKey = String($os.getenv("FIREBASE_WEB_API_KEY") || "").trim();
  } catch (_) {}

  if (!projectId || !apiKey) {
    try {
      var raw = toString($os.readFile(__hooks + "/firebase_config.json"));
      var parsed = JSON.parse(raw);
      if (!projectId && parsed && parsed.projectId) {
        projectId = String(parsed.projectId).trim();
      }
      if (!apiKey && parsed && parsed.apiKey) {
        apiKey = String(parsed.apiKey).trim();
      }
    } catch (err) {
      throw new Error("Missing Firebase config in pb_hooks/firebase_config.json: " + err);
    }
  }

  if (!projectId || !apiKey) {
    throw new Error("Firebase projectId and apiKey are required for token verification.");
  }

  return { projectId: projectId, apiKey: apiKey };
}

function decodeJwtPayload(token) {
  var parts = String(token || "").split(".");
  if (parts.length !== 3) throw new Error("JWT must have 3 parts");
  var s = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var bits = 0, value = 0, encoded = "";
  for (var i = 0; i < s.length; i++) {
    var c = s.charAt(i);
    if (c === "=") break;
    var idx = alphabet.indexOf(c);
    if (idx === -1) throw new Error("Invalid base64 character");
    value = ((value << 6) | idx) & 0xffffff;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      var b = (value >> bits) & 0xff;
      encoded += "%" + (b < 16 ? "0" : "") + b.toString(16);
    }
  }
  return JSON.parse(decodeURIComponent(encoded));
}

function verifyFirebaseIdToken(idToken) {
  if (!idToken || typeof idToken !== "string" || idToken.length < 20) {
    return { ok: false, message: "Missing or malformed Firebase ID token." };
  }

  var cfg;
  try {
    cfg = loadFirebaseConfig();
  } catch (cfgErr) {
    return { ok: false, message: String(cfgErr && cfgErr.message ? cfgErr.message : cfgErr) };
  }

  var claims;
  try {
    claims = decodeJwtPayload(idToken);
  } catch (_) {
    return { ok: false, message: "Malformed Firebase ID token." };
  }

  var expectedIss = "https://securetoken.google.com/" + cfg.projectId;
  var aud = String((claims && claims["aud"]) || "");
  var iss = String((claims && claims["iss"]) || "");
  var sub = String((claims && (claims["sub"] || claims["user_id"])) || "");
  var CLOCK_SKEW_SEC = 300;
  var iat = Number((claims && claims["iat"]) || 0);
  var exp = Number((claims && claims["exp"]) || 0);
  var nowSec = Math.floor(Date.now() / 1000);

  if (aud !== cfg.projectId || iss !== expectedIss || !sub) {
    return { ok: false, message: "Firebase token audience or issuer mismatch." };
  }
  if (iat && iat > nowSec + CLOCK_SKEW_SEC) {
    return { ok: false, message: "Firebase ID token issued in the future. Please sync the server PC clock." };
  }
  if (!exp || exp <= nowSec - CLOCK_SKEW_SEC) {
    return { ok: false, message: "Firebase ID token has expired. Please sign in again." };
  }

  var res;
  try {
    res = $http.send({
      method: "POST",
      url: "https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" + encodeURIComponent(cfg.apiKey),
      body: JSON.stringify({ idToken: idToken }),
      headers: { "Content-Type": "application/json" },
      timeout: 15,
    });
  } catch (httpErr) {
    return {
      ok: false,
      message: "Unable to verify Firebase token with Google Identity Toolkit: " + String(httpErr),
    };
  }

  if (!res || res.statusCode !== 200 || !res.json || !Array.isArray(res.json.users) || res.json.users.length === 0) {
    return { ok: false, message: "Firebase ID token verification rejected by Google Identity Toolkit." };
  }

  var fbUser = res.json.users[0];
  if (!fbUser || fbUser.disabled === true || String(fbUser.localId || "") !== sub) {
    return { ok: false, message: "Firebase user is disabled or token subject mismatch." };
  }

  var provider = "firebase_email";
  if (Array.isArray(fbUser.providerUserInfo)) {
    for (var i = 0; i < fbUser.providerUserInfo.length; i++) {
      if (fbUser.providerUserInfo[i] && fbUser.providerUserInfo[i].providerId === "google.com") {
        provider = "firebase_google";
        break;
      }
    }
  }

  var email = String(fbUser.email || "").trim();
  return {
    ok: true,
    user: {
      uid: String(fbUser.localId),
      email: email,
      emailLower: email.toLowerCase(),
      emailVerified: Boolean(fbUser.emailVerified),
      displayName: String(fbUser.displayName || "").trim(),
      photoUrl: String(fbUser.photoUrl || "").trim(),
      provider: provider,
    },
  };
}

function safeProfileSummary(record) {
  return {
    id: record.id,
    username: record.getString("username"),
    email: record.email(),
    role: record.getString("role"),
    section: record.getString("section"),
    status: record.getString("status"),
    full_name: record.getString("full_name"),
    guard_id: record.getString("guard_id"),
    auth_provider: record.getString("auth_provider"),
  };
}

function writeAuditLog(username, action, detailsObj) {
  try {
    var col = $app.findCollectionByNameOrId("audit_logs");
    var logRecord = new Record(col);
    logRecord.set("username", String(username || "system"));
    logRecord.set("action", String(action || "AUTH_EVENT"));
    logRecord.set("details", typeof detailsObj === "string" ? detailsObj : JSON.stringify(detailsObj || {}));
    logRecord.set("created_at", new Date().toISOString());
    $app.save(logRecord);
  } catch (err) {
    console.warn("[firebase_auth] audit_logs write warning:", err);
  }
}

module.exports = {
  loadFirebaseConfig: loadFirebaseConfig,
  decodeJwtPayload: decodeJwtPayload,
  verifyFirebaseIdToken: verifyFirebaseIdToken,
  safeProfileSummary: safeProfileSummary,
  writeAuditLog: writeAuditLog,
};
