const ADMIN_PASSWORD_PROPERTY =
  "ADMIN_PASSWORD";

const ADMIN_SESSION_PREFIX =
  "ADMIN_SESSION_";

const ADMIN_SESSION_DURATION =
  6 * 60 * 60; // 6 hours


/**
 * Authenticates an administrator and creates
 * a temporary admin session.
 */
function loginAdmin(password) {
  const configuredPassword =
    PropertiesService
      .getScriptProperties()
      .getProperty(
        ADMIN_PASSWORD_PROPERTY
      );

  if (!configuredPassword) {
    throw new Error(
      "Aucun mot de passe administrateur n'est configuré."
    );
  }

  if (
    typeof password !== "string" ||
    password !== configuredPassword
  ) {
    // Small delay to make brute force slightly
    // more expensive.
    Utilities.sleep(500);

    throw new Error(
      "Mot de passe administrateur incorrect."
    );
  }

  const token =
    Utilities.getUuid() +
    Utilities.getUuid();

  const sessionKey =
    buildAdminSessionKey_(token);

  CacheService
    .getScriptCache()
    .put(
      sessionKey,
      "ADMIN",
      ADMIN_SESSION_DURATION
    );

  return {
    token: token,
    isAdmin: true
  };
}


/**
 * Checks the current session.
 */
function getAccessContext(token) {
  return {
    isAdmin:
      isAdminSession(token)
  };
}


/**
 * Removes an existing admin session.
 */
function logoutAdmin(token) {
  if (token) {
    CacheService
      .getScriptCache()
      .remove(
        buildAdminSessionKey_(token)
      );
  }

  return {
    success: true
  };
}


/**
 * Internal access check.
 *
 * This function must be used by every backend
 * function exposing protected information.
 */
function isAdminSession(token) {
  if (
    !token ||
    typeof token !== "string"
  ) {
    return false;
  }

  const value =
    CacheService
      .getScriptCache()
      .get(
        buildAdminSessionKey_(token)
      );

  return value === "ADMIN";
}


/**
 * Throws when an admin session is required.
 */
function requireAdmin(token) {
  if (!isAdminSession(token)) {
    throw new Error(
      "Session administrateur invalide ou expirée."
    );
  }
}


function buildAdminSessionKey_(token) {
  return (
    ADMIN_SESSION_PREFIX +
    sha256_(token)
  );
}


function sha256_(value) {
  const bytes =
    Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      value,
      Utilities.Charset.UTF_8
    );

  return bytes
    .map(byte => {
      const unsignedByte =
        byte < 0
          ? byte + 256
          : byte;

      return unsignedByte
        .toString(16)
        .padStart(2, "0");
    })
    .join("");
}