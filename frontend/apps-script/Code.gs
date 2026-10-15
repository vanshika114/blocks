const API_VERSION = 1;
const CERTIFICATE_SHEET = "Certificates";
const REQUIRED_HEADERS = [
  "id",
  "recipientName",
  "title",
  "program",
  "institution",
  "issuedAt",
  "expiresAt",
  "status",
  "revocationReason",
  "revokedAt",
  "revocationTransactionReference",
  "createdAt",
  "updatedAt",
  "revision",
];
const MAX_PAGE_SIZE = 100;
const MAX_TEXT_LENGTH = 200;

function doPost(event) {
  try {
    authorizeIssuer_();
    if (!event || !event.postData || typeof event.postData.contents !== "string") {
      throw apiError_("INVALID_REQUEST", "A JSON request body is required.");
    }

    let request;
    try {
      request = JSON.parse(event.postData.contents);
    } catch (error) {
      throw apiError_("INVALID_JSON", "The request body must be valid JSON.");
    }
    validateRequest_(request);
    const data = dispatch_(request.operation, request.payload);
    return jsonOutput_({ ok: true, data: data });
  } catch (error) {
    const code = error && error.apiCode ? error.apiCode : "INTERNAL_ERROR";
    const message =
      error && error.apiCode
        ? error.message
        : "The request could not be completed.";
    console.error("CertifyX API request failed: " + code);
    return jsonOutput_({
      ok: false,
      error: { code: code, message: message },
    });
  }
}

function authorizeIssuer_() {
  const properties = PropertiesService.getScriptProperties();
  const allowlist = (properties.getProperty("ALLOWED_ISSUERS") || "")
    .split(",")
    .map(function (email) {
      return email.trim().toLowerCase();
    })
    .filter(Boolean);
  const activeEmail = (Session.getActiveUser().getEmail() || "")
    .trim()
    .toLowerCase();

  if (allowlist.length === 0 || !activeEmail || allowlist.indexOf(activeEmail) < 0) {
    throw apiError_(
      "FORBIDDEN",
      "Sign in with an allowlisted institutional Google account.",
    );
  }
}

function validateRequest_(request) {
  requireObject_(request, "request");
  requireExactKeys_(request, ["version", "operation", "payload"], [], "request");
  if (request.version !== API_VERSION) {
    throw apiError_("UNSUPPORTED_VERSION", "API version 1 is required.");
  }
  if (
    ["create", "list", "get", "update", "revoke"].indexOf(request.operation) < 0
  ) {
    throw apiError_("UNKNOWN_OPERATION", "The requested operation is not supported.");
  }
  requireObject_(request.payload, "payload");
}

function dispatch_(operation, payload) {
  switch (operation) {
    case "create":
      return createCertificate_(payload);
    case "list":
      return listCertificates_(payload);
    case "get":
      return getCertificate_(payload);
    case "update":
      return updateMetadata_(payload);
    case "revoke":
      return revokeCertificate_(payload);
    default:
      throw apiError_("UNKNOWN_OPERATION", "The requested operation is not supported.");
  }
}

function createCertificate_(payload) {
  requireExactKeys_(payload, ["certificate"], [], "payload");
  const input = payload.certificate;
  requireObject_(input, "certificate");
  requireExactKeys_(
    input,
    ["recipientName", "title", "program", "institution", "issuedAt", "expiresAt"],
    [],
    "certificate",
  );

  const certificate = {
    id: "",
    recipientName: text_(input.recipientName, "recipientName", MAX_TEXT_LENGTH),
    title: text_(input.title, "title", MAX_TEXT_LENGTH),
    program: text_(input.program, "program", MAX_TEXT_LENGTH),
    institution: text_(input.institution, "institution", MAX_TEXT_LENGTH),
    issuedAt: date_(input.issuedAt, "issuedAt"),
    expiresAt: nullableDate_(input.expiresAt, "expiresAt"),
  };
  validateDateOrder_(certificate.issuedAt, certificate.expiresAt);
  if (certificate.issuedAt > today_()) {
    throw apiError_("INVALID_DATE", "issuedAt cannot be in the future.");
  }

  return withLock_(function () {
    const sheet = certificateSheet_();
    const rows = dataRows_(sheet);
    let id;
    do {
      id =
        "CX-" +
        certificate.issuedAt.slice(0, 4) +
        "-" +
        Utilities.getUuid().replace(/-/g, "").slice(0, 8).toUpperCase();
    } while (rows.some(function (row) { return row.id === id; }));

    const now = new Date().toISOString();
    const record = {
      id: id,
      recipientName: certificate.recipientName,
      title: certificate.title,
      program: certificate.program,
      institution: certificate.institution,
      issuedAt: certificate.issuedAt,
      expiresAt: certificate.expiresAt,
      status: "active",
      revocationReason: "",
      revokedAt: "",
      revocationTransactionReference: "",
      createdAt: now,
      updatedAt: now,
      revision: 1,
    };
    appendRecord_(sheet, record);
    return { certificate: publicCertificate_(record) };
  });
}

function listCertificates_(payload) {
  requireExactKeys_(
    payload,
    [],
    ["limit", "offset", "status", "institution"],
    "payload",
  );
  const limit = payload.limit === undefined ? 50 : integer_(payload.limit, "limit");
  const offset = payload.offset === undefined ? 0 : integer_(payload.offset, "offset");
  if (limit < 1 || limit > MAX_PAGE_SIZE || offset < 0) {
    throw apiError_("INVALID_PAGINATION", "limit must be 1–100 and offset must be non-negative.");
  }

  const status = payload.status === undefined ? "" : text_(payload.status, "status", 16);
  if (status && ["active", "revoked", "expired"].indexOf(status) < 0) {
    throw apiError_("INVALID_STATUS", "status must be active, revoked, or expired.");
  }
  const institution =
    payload.institution === undefined
      ? ""
      : text_(payload.institution, "institution", MAX_TEXT_LENGTH).toLowerCase();
  const today = today_();

  const records = dataRows_(certificateSheet_())
    .map(function (row) { return publicCertificate_(row); })
    .filter(function (record) {
      const effectiveStatus =
        record.status === "active" && record.expiresAt && record.expiresAt < today
          ? "expired"
          : record.status;
      const matchesStatus = !status || status === effectiveStatus;
      const matchesInstitution =
        !institution || record.institution.toLowerCase() === institution;
      return matchesStatus && matchesInstitution;
    })
    .sort(function (left, right) {
      return right.issuedAt.localeCompare(left.issuedAt) || left.id.localeCompare(right.id);
    });
  const items = records.slice(offset, offset + limit);
  const nextOffset = offset + items.length < records.length ? offset + items.length : null;
  return { items: items, total: records.length, nextOffset: nextOffset };
}

function getCertificate_(payload) {
  requireExactKeys_(payload, ["id"], [], "payload");
  const id = certificateId_(payload.id);
  const record = dataRows_(certificateSheet_).find(function (row) {
    return row.id === id;
  });
  if (!record) {
    throw apiError_("NOT_FOUND", "No certificate record was found for this ID.");
  }
  return { certificate: publicCertificate_(record) };
}

function updateMetadata_(payload) {
  requireExactKeys_(payload, ["id", "metadata"], [], "payload");
  const id = certificateId_(payload.id);
  const metadata = payload.metadata;
  requireObject_(metadata, "metadata");
  const allowed = ["title", "program", "institution", "expiresAt"];
  const keys = Object.keys(metadata);
  if (keys.length === 0 || keys.some(function (key) { return allowed.indexOf(key) < 0; })) {
    throw apiError_(
      "INVALID_METADATA",
      "metadata must contain title, program, institution, or expiresAt only.",
    );
  }

  const update = {};
  keys.forEach(function (key) {
    update[key] =
      key === "expiresAt"
        ? nullableDate_(metadata[key], "expiresAt")
        : text_(metadata[key], key, MAX_TEXT_LENGTH);
  });

  return withLock_(function () {
    const sheet = certificateSheet_();
    const rowIndex = findRowIndex_(sheet, id);
    const record = recordAt_(sheet, rowIndex);
    if (Object.prototype.hasOwnProperty.call(update, "expiresAt")) {
      validateDateOrder_(record.issuedAt, update.expiresAt);
    }
    Object.keys(update).forEach(function (key) {
      record[key] = update[key] === null ? "" : update[key];
    });
    record.updatedAt = new Date().toISOString();
    record.revision += 1;
    writeRecord_(sheet, rowIndex, record);
    return { certificate: publicCertificate_(record) };
  });
}

function revokeCertificate_(payload) {
  requireExactKeys_(payload, ["id", "reason"], ["transactionReference"], "payload");
  const id = certificateId_(payload.id);
  const reason = text_(payload.reason, "reason", 500);
  const transactionReference =
    payload.transactionReference === undefined || payload.transactionReference === null
      ? ""
      : text_(payload.transactionReference, "transactionReference", 80);
  if (
    transactionReference &&
    !/^0x[a-fA-F0-9]{64}$/.test(transactionReference)
  ) {
    throw apiError_(
      "INVALID_TRANSACTION_REFERENCE",
      "transactionReference must be a 32-byte hexadecimal hash when provided.",
    );
  }

  return withLock_(function () {
    const sheet = certificateSheet_();
    const rowIndex = findRowIndex_(sheet, id);
    const record = recordAt_(sheet, rowIndex);
    if (record.status === "revoked") {
      throw apiError_("ALREADY_REVOKED", "This certificate record is already revoked.");
    }
    record.status = "revoked";
    record.revocationReason = reason;
    record.revokedAt = new Date().toISOString();
    record.revocationTransactionReference = transactionReference;
    record.updatedAt = record.revokedAt;
    record.revision += 1;
    writeRecord_(sheet, rowIndex, record);
    return { certificate: publicCertificate_(record) };
  });
}

function certificateSheet_() {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  if (!spreadsheetId) {
    throw apiError_("SETUP_REQUIRED", "The spreadsheet has not been configured.");
  }
  let spreadsheet;
  try {
    spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  } catch (error) {
    throw apiError_("SETUP_REQUIRED", "The configured spreadsheet could not be opened.");
  }
  const sheet = spreadsheet.getSheetByName(CERTIFICATE_SHEET);
  if (!sheet) {
    throw apiError_("SETUP_REQUIRED", "The required Certificates sheet is missing.");
  }
  const actualHeaders = sheet.getRange(1, 1, 1, REQUIRED_HEADERS.length).getDisplayValues()[0];
  const extraColumns = sheet.getLastColumn() > REQUIRED_HEADERS.length;
  if (
    extraColumns ||
    REQUIRED_HEADERS.some(function (header, index) { return actualHeaders[index] !== header; })
  ) {
    throw apiError_("SCHEMA_MISMATCH", "The Certificates sheet headers do not match the API schema.");
  }
  return sheet;
}

function dataRows_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return [];
  }
  return sheet
    .getRange(2, 1, lastRow - 1, REQUIRED_HEADERS.length)
    .getValues()
    .map(function (values, index) {
      const record = {};
      REQUIRED_HEADERS.forEach(function (header, column) {
        let value = values[column];
        if (typeof value === "string") {
          value = unescapeCellText_(value);
        }
        record[header] = value;
      });
      record._rowIndex = index + 2;
      return record;
    })
    .filter(function (record) { return record.id !== ""; });
}

function appendRecord_(sheet, record) {
  const values = REQUIRED_HEADERS.map(function (header) {
    return sheetValue_(record[header]);
  });
  const row = sheet.getLastRow() + 1;
  sheet.getRange(row, 1, 1, REQUIRED_HEADERS.length).setValues([values]);
}

function writeRecord_(sheet, rowIndex, record) {
  const values = REQUIRED_HEADERS.map(function (header) {
    return sheetValue_(record[header]);
  });
  sheet.getRange(rowIndex, 1, 1, REQUIRED_HEADERS.length).setValues([values]);
}

function recordAt_(sheet, rowIndex) {
  const record = dataRows_(sheet).find(function (row) { return row._rowIndex === rowIndex; });
  if (!record) {
    throw apiError_("NOT_FOUND", "No certificate record was found for this ID.");
  }
  return record;
}

function findRowIndex_(sheet, id) {
  const record = dataRows_(sheet).find(function (row) { return row.id === id; });
  if (!record) {
    throw apiError_("NOT_FOUND", "No certificate record was found for this ID.");
  }
  return record._rowIndex;
}

function publicCertificate_(record) {
  const isRevoked = record.status === "revoked";
  return {
    id: String(record.id),
    recipientName: String(record.recipientName),
    title: String(record.title),
    program: String(record.program),
    institution: String(record.institution),
    issuedAt: String(record.issuedAt),
    expiresAt: record.expiresAt ? String(record.expiresAt) : null,
    status: isRevoked ? "revoked" : "active",
    revocation: isRevoked
      ? {
          reason: String(record.revocationReason),
          recordedAt: String(record.revokedAt),
          storage: "off_chain_metadata",
          transactionReference: record.revocationTransactionReference
            ? String(record.revocationTransactionReference)
            : null,
          transactionReferenceVerified: false,
        }
      : null,
  };
}

function certificateId_(value) {
  const id = text_(value, "id", 40).toUpperCase();
  if (!/^CX-\d{4}-[A-F0-9]{8}$/.test(id)) {
    throw apiError_("INVALID_ID", "id must be a CertifyX certificate ID.");
  }
  return id;
}

function date_(value, field) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw apiError_("INVALID_DATE", field + " must use YYYY-MM-DD format.");
  }
  const parsed = new Date(value + "T00:00:00.000Z");
  if (isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw apiError_("INVALID_DATE", field + " must be a real calendar date.");
  }
  return value;
}

function nullableDate_(value, field) {
  return value === null ? null : date_(value, field);
}

function validateDateOrder_(issuedAt, expiresAt) {
  if (expiresAt && expiresAt <= issuedAt) {
    throw apiError_("INVALID_DATE", "expiresAt must be later than issuedAt.");
  }
}

function text_(value, field, maxLength) {
  if (typeof value !== "string") {
    throw apiError_("INVALID_FIELD", field + " must be text.");
  }
  const text = value.trim();
  if (
    !text ||
    text.length > maxLength ||
    /[\u0000-\u001f\u007f]/.test(text)
  ) {
    throw apiError_("INVALID_FIELD", field + " is empty or exceeds its allowed format.");
  }
  return text;
}

function integer_(value, field) {
  if (!Number.isSafeInteger(value)) {
    throw apiError_("INVALID_FIELD", field + " must be an integer.");
  }
  return value;
}

function requireObject_(value, field) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw apiError_("INVALID_REQUEST", field + " must be an object.");
  }
}

function requireExactKeys_(value, requiredKeys, optionalKeys, field) {
  const expected = requiredKeys.concat(optionalKeys);
  const actual = Object.keys(value);
  if (actual.some(function (key) { return expected.indexOf(key) < 0; })) {
    throw apiError_("INVALID_REQUEST", field + " contains unsupported fields.");
  }
  requiredKeys.forEach(function (key) {
    if (!Object.prototype.hasOwnProperty.call(value, key)) {
      throw apiError_("INVALID_REQUEST", field + "." + key + " is required.");
    }
  });
}

function sheetValue_(value) {
  if (typeof value !== "string") {
    return value;
  }
  return /^[=+\-@]/.test(value) ? "'" + value : value;
}

function unescapeCellText_(value) {
  return /^'[=+\-@]/.test(value) ? value.slice(1) : value;
}

function today_() {
  return Utilities.formatDate(new Date(), "Etc/UTC", "yyyy-MM-dd");
}

function withLock_(action) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    return action();
  } finally {
    lock.releaseLock();
  }
}

function apiError_(code, message) {
  const error = new Error(message);
  error.apiCode = code;
  return error;
}

function jsonOutput_(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
