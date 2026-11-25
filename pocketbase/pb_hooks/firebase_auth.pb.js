/// <reference path="../pb_data/types.d.ts" />
// =============================================================================
// MEEDOSys v2.0 - Firebase Auth Exchange, Registration, Linking & RBAC Revocation
// =============================================================================

routerAdd("POST", "/api/meedo/firebase-auth", (e) => {
  const helpers = require(`${__hooks}/firebase_helpers.js`);
  const info = e.requestInfo();
  const body = (info && info.body) || {};
  const idToken = String(body.idToken || "");

  const verified = helpers.verifyFirebaseIdToken(idToken);
  if (!verified.ok) {
    return e.json(401, {
      code: "INVALID_FIREBASE_TOKEN",
      message: verified.message || "Invalid Firebase ID token.",
    });
  }

  const fbUser = verified.user;
  let record = null;

  try {
    record = $app.findFirstRecordByFilter("profiles", "firebase_uid={:uid}", {
      uid: fbUser.uid,
    });
  } catch (_) {
    record = null;
  }

  // Verified email auto-link for Admin pre-authorized accounts without firebase_uid yet
  if (!record && fbUser.emailLower) {
    const emailMatches = $app.findAllRecords(
      "profiles",
      $dbx.exp("(LOWER(email) = {:email} OR LOWER(username) = {:email})", {
        email: fbUser.emailLower,
      })
    );

    if (emailMatches && emailMatches.length > 0) {
      const candidate = emailMatches[0];
      const existingUid = candidate.getString("firebase_uid");
      if (existingUid && existingUid !== fbUser.uid) {
        return e.json(409, {
          code: "ACCOUNT_CONFLICT",
          message: "This email is already linked to a different Firebase credential.",
        });
      }

      if (!fbUser.emailVerified) {
        return e.json(403, {
          code: "EMAIL_VERIFICATION_REQUIRED",
          email: fbUser.email,
          message: "Please verify your email address before linking to your pre-assigned municipal profile.",
        });
      }

      candidate.set("firebase_uid", fbUser.uid);
      if (fbUser.email) candidate.setEmail(fbUser.email);
      candidate.set("auth_provider", fbUser.provider);
      if (fbUser.photoUrl) candidate.set("photo_url", fbUser.photoUrl);
      candidate.setEmailVisibility(true);
      candidate.setVerified(true);
      candidate.set("updated_at", new Date().toISOString());
      $app.save(candidate);
      record = candidate;

      helpers.writeAuditLog(record.getString("username"), "FIREBASE_AUTO_LINKED", {
        firebase_uid: fbUser.uid,
        email: fbUser.email,
        provider: fbUser.provider,
        timestamp: new Date().toISOString(),
      });
    }
  }

  if (!record) {
    return e.json(404, {
      code: "PROFILE_REQUIRED",
      firebaseUser: {
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName,
        emailVerified: fbUser.emailVerified,
        provider: fbUser.provider,
      },
      message: "Complete your departmental registration or link an existing MEEDOSys account.",
    });
  }

  // Keep synced profile metadata current
  let metadataChanged = false;
  if (fbUser.email && record.email().toLowerCase() !== fbUser.emailLower) {
    record.setEmail(fbUser.email);
    metadataChanged = true;
  }
  if (!record.emailVisibility()) {
    record.setEmailVisibility(true);
    metadataChanged = true;
  }
  if (fbUser.emailVerified && !record.verified()) {
    record.setVerified(true);
    metadataChanged = true;
  }
  if (fbUser.provider && record.getString("auth_provider") !== fbUser.provider) {
    record.set("auth_provider", fbUser.provider);
    metadataChanged = true;
  }
  if (fbUser.photoUrl && record.getString("photo_url") !== fbUser.photoUrl) {
    record.set("photo_url", fbUser.photoUrl);
    metadataChanged = true;
  }
  if (metadataChanged) {
    record.set("updated_at", new Date().toISOString());
    $app.save(record);
  }

  const status = record.getString("status");
  if (status === "Pending") {
    return e.json(403, {
      code: "ACCOUNT_PENDING",
      status: "Pending",
      profile: helpers.safeProfileSummary(record),
      message: "Account approval pending. Please contact the MEEDO Office to activate your departmental credentials.",
    });
  }

  if (status === "Blocked") {
    return e.json(403, {
      code: "ACCOUNT_BLOCKED",
      status: "Blocked",
      profile: helpers.safeProfileSummary(record),
      message: "Account suspended. This user account has been deactivated by the Administrator.",
    });
  }

  if (status !== "Approved") {
    return e.json(403, {
      code: "ACCOUNT_INACTIVE",
      status: status,
      profile: helpers.safeProfileSummary(record),
      message: "Account is not approved for system access.",
    });
  }

  helpers.writeAuditLog(record.getString("username"), "USER_LOGIN", {
    role: record.getString("role"),
    section: record.getString("section"),
    auth_provider: fbUser.provider,
    firebase_uid: fbUser.uid,
    timestamp: new Date().toISOString(),
  });

  return $apis.recordAuthResponse(e, record, "firebase", null);
});

routerAdd("POST", "/api/meedo/firebase-register", (e) => {
  const helpers = require(`${__hooks}/firebase_helpers.js`);
  const info = e.requestInfo();
  const body = (info && info.body) || {};
  const idToken = String(body.idToken || "");

  const verified = helpers.verifyFirebaseIdToken(idToken);
  if (!verified.ok) {
    return e.json(401, {
      code: "INVALID_FIREBASE_TOKEN",
      message: verified.message || "Invalid Firebase ID token.",
    });
  }

  const fbUser = verified.user;

  let existingUidRecord = null;
  try {
    existingUidRecord = $app.findFirstRecordByFilter("profiles", "firebase_uid={:uid}", {
      uid: fbUser.uid,
    });
  } catch (_) {
    existingUidRecord = null;
  }
  if (existingUidRecord) {
    return e.json(409, {
      code: "PROFILE_EXISTS",
      message: "A departmental profile is already linked to this Firebase account.",
    });
  }

  if (fbUser.emailLower) {
    const existingEmails = $app.findAllRecords(
      "profiles",
      $dbx.exp("LOWER(email) = {:email}", { email: fbUser.emailLower })
    );
    if (existingEmails && existingEmails.length > 0) {
      return e.json(409, {
        code: "EMAIL_EXISTS",
        message: "This email address is already registered. Please sign in or verify your email to link it.",
      });
    }
  }

  const cleanUsername = String(body.username || "").trim();
  if (!cleanUsername || cleanUsername.length < 2) {
    return e.json(400, {
      code: "INVALID_USERNAME",
      message: "Username is required (at least 2 characters).",
    });
  }

  const existingUsernames = $app.findAllRecords(
    "profiles",
    $dbx.exp("LOWER(username) = {:uname} OR LOWER(username_lower) = {:uname}", {
      uname: cleanUsername.toLowerCase(),
    })
  );
  if (existingUsernames && existingUsernames.length > 0) {
    return e.json(409, {
      code: "USERNAME_TAKEN",
      message: "This username is already registered. Please choose another.",
    });
  }

  const section = String(body.section || "").trim().toUpperCase();
  const allowedSections = ["A", "B", "C", "D", "E", "F"];
  if (allowedSections.indexOf(section) === -1) {
    return e.json(400, {
      code: "INVALID_SECTION",
      message: "Public registration is restricted to departmental staff sections (A–F).",
    });
  }

  const cleanGuardId = section === "F" ? String(body.guard_id || "").trim().toUpperCase() : "";
  if (section === "F" && !cleanGuardId) {
    return e.json(400, {
      code: "GUARD_ID_REQUIRED",
      message: "Guard ID is required for Section F Market Guard registration.",
    });
  }

  if (cleanGuardId) {
    const existingGuards = $app.findAllRecords(
      "profiles",
      $dbx.exp("UPPER(guard_id) = {:gid}", { gid: cleanGuardId })
    );
    if (existingGuards && existingGuards.length > 0) {
      return e.json(409, {
        code: "GUARD_ID_TAKEN",
        message: "This Guard ID is already assigned to another account.",
      });
    }
  }

  const cleanFullName = String(body.full_name || fbUser.displayName || cleanUsername).trim();
  const cleanRankTitle = section === "F" ? String(body.rank_title || "SO1").trim() : "";
  const cleanCallSign = section === "F" ? String(body.radio_call_sign || "").trim().toUpperCase() : "";
  const cleanDefaultArea = section === "F" ? String(body.default_area || "General Public Market").trim() : "";
  const nowIso = new Date().toISOString();

  const col = $app.findCollectionByNameOrId("profiles");
  const record = new Record(col);
  record.set("username", cleanUsername);
  record.set("username_lower", cleanUsername.toLowerCase());
  // Strictly server-enforced least-privilege defaults (ignore any client role/status)
  record.set("role", "Staff");
  record.set("section", section);
  record.set("status", "Pending");
  record.set("full_name", cleanFullName);
  record.set("guard_id", cleanGuardId);
  record.set("rank_title", cleanRankTitle);
  record.set("radio_call_sign", cleanCallSign);
  record.set("default_area", cleanDefaultArea);
  record.set("firebase_uid", fbUser.uid);
  record.set("auth_provider", fbUser.provider);
  record.set("photo_url", fbUser.photoUrl);
  record.set("created_at", nowIso);
  record.set("updated_at", nowIso);

  if (fbUser.email) {
    record.setEmail(fbUser.email);
  }
  record.setEmailVisibility(true);
  record.setVerified(Boolean(fbUser.emailVerified));
  record.setPassword($security.randomString(32));

  $app.save(record);

  helpers.writeAuditLog(cleanUsername, "USER_REGISTERED_FIREBASE", {
    section: section,
    guard_id: cleanGuardId || null,
    email: fbUser.email,
    provider: fbUser.provider,
    firebase_uid: fbUser.uid,
    timestamp: nowIso,
  });

  return e.json(201, {
    code: "ACCOUNT_PENDING",
    status: "Pending",
    profile: helpers.safeProfileSummary(record),
    message: "Registration submitted! Awaiting Administrator approval.",
  });
});

routerAdd("POST", "/api/meedo/firebase-link", (e) => {
  const helpers = require(`${__hooks}/firebase_helpers.js`);
  const info = e.requestInfo();
  const body = (info && info.body) || {};
  const idToken = String(body.idToken || "");
  const identifier = String(body.identifier || "").trim();
  const password = String(body.password || "");

  const verified = helpers.verifyFirebaseIdToken(idToken);
  if (!verified.ok) {
    return e.json(401, {
      code: "INVALID_FIREBASE_TOKEN",
      message: verified.message || "Invalid Firebase ID token.",
    });
  }

  const fbUser = verified.user;

  let alreadyLinked = null;
  try {
    alreadyLinked = $app.findFirstRecordByFilter("profiles", "firebase_uid={:uid}", {
      uid: fbUser.uid,
    });
  } catch (_) {
    alreadyLinked = null;
  }
  if (alreadyLinked) {
    return e.json(409, {
      code: "FIREBASE_ALREADY_LINKED",
      message: "This Firebase account is already linked to a MEEDOSys profile.",
    });
  }

  if (!identifier || !password) {
    return e.json(400, {
      code: "CREDENTIALS_REQUIRED",
      message: "Existing username (or Guard ID) and password are required.",
    });
  }

  const matches = $app.findAllRecords(
    "profiles",
    $dbx.exp("(LOWER(username) = {:lower} OR UPPER(guard_id) = {:upper} OR LOWER(email) = {:lower})", {
      lower: identifier.toLowerCase(),
      upper: identifier.toUpperCase(),
    })
  );

  if (!matches || matches.length === 0) {
    return e.json(401, {
      code: "INVALID_CREDENTIALS",
      message: "Invalid username, Guard ID, or password.",
    });
  }

  const record = matches[0];
  const existingProfileUid = record.getString("firebase_uid");
  if (existingProfileUid && existingProfileUid !== fbUser.uid) {
    return e.json(409, {
      code: "ALREADY_LINKED",
      message: "This MEEDOSys account is already linked to another Firebase login.",
    });
  }

  if (!record.validatePassword(password)) {
    return e.json(401, {
      code: "INVALID_CREDENTIALS",
      message: "Invalid username, Guard ID, or password.",
    });
  }

  const status = record.getString("status");
  if (status === "Blocked") {
    return e.json(403, {
      code: "ACCOUNT_BLOCKED",
      status: "Blocked",
      message: "Account suspended. This user account has been deactivated by the Administrator.",
    });
  }

  if (fbUser.emailLower) {
    const conflictingEmails = $app.findAllRecords(
      "profiles",
      $dbx.exp("LOWER(email) = {:email} AND id != {:id}", {
        email: fbUser.emailLower,
        id: record.id,
      })
    );
    if (conflictingEmails && conflictingEmails.length > 0) {
      return e.json(409, {
        code: "EMAIL_IN_USE",
        message: "This Firebase email is already assigned to a different MEEDOSys profile.",
      });
    }
  }

  const nowIso = new Date().toISOString();
  record.set("firebase_uid", fbUser.uid);
  if (fbUser.email) record.setEmail(fbUser.email);
  record.set("auth_provider", fbUser.provider);
  if (fbUser.photoUrl) record.set("photo_url", fbUser.photoUrl);
  record.setEmailVisibility(true);
  record.setVerified(Boolean(fbUser.emailVerified));
  record.set("updated_at", nowIso);
  $app.save(record);

  helpers.writeAuditLog(record.getString("username"), "FIREBASE_ACCOUNT_LINKED", {
    firebase_uid: fbUser.uid,
    email: fbUser.email,
    provider: fbUser.provider,
    timestamp: nowIso,
  });

  if (status !== "Approved") {
    return e.json(403, {
      code: "ACCOUNT_PENDING",
      status: status,
      profile: helpers.safeProfileSummary(record),
      message: "Account linked! Awaiting Administrator approval before dashboard access.",
    });
  }

  return $apis.recordAuthResponse(e, record, "firebase", null);
});

onRecordUpdateExecute((e) => {
  const orig = e.record.original();
  const origUsername = String(orig.getString("username") || "").trim().toLowerCase();

  // Protect root municipal super-administrator from accidental demotion or suspension
  if (origUsername === "admin") {
    if (e.record.getString("role") !== "Admin" || e.record.getString("status") !== "Approved") {
      throw new ForbiddenError("Root administrator account cannot be demoted or suspended.", null);
    }
  }

  const statusChanged = orig.getString("status") !== e.record.getString("status");
  const roleChanged = orig.getString("role") !== e.record.getString("role");
  const sectionChanged = orig.getString("section") !== e.record.getString("section");

  if ((statusChanged && e.record.getString("status") !== "Approved") || roleChanged || sectionChanged) {
    e.record.refreshTokenKey();
  }

  return e.next();
}, "profiles");
