const multer = require("multer");
const path   = require("path");
const fs     = require("fs");

// Ensure upload directories exist on disk
const uploadsBase          = path.join(__dirname, "../uploads");
const eventsUploads        = path.join(uploadsBase, "events");
const posterUploads        = path.join(uploadsBase, "posters");
const docsUploads          = path.join(uploadsBase, "docs");
const profileUploads       = path.join(uploadsBase, "profiles");
const certTemplateUploads  = path.join(uploadsBase, "certificate-templates");

[uploadsBase, eventsUploads, posterUploads, docsUploads, profileUploads, certTemplateUploads].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure disk storage for Event Photos
const eventStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, eventsUploads);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `event-${uniqueSuffix}${ext}`);
  },
});

// Configure disk storage for Posters
const posterStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, posterUploads);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `poster-${uniqueSuffix}${ext}`);
  },
});

// Image file filter (jpg, png, webp)
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const mimeType = allowedTypes.test(file.mimetype);
  const extName  = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimeType && extName) {
    return cb(null, true);
  }
  cb(new Error("Only image files (.jpg, .jpeg, .png, .webp) are allowed!"));
};

// 5MB limit, max 20 photos per batch
const uploadEventPhotos = multer({
  storage: eventStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: imageFilter,
}).array("photos", 20);

// Single poster upload
const uploadPoster = multer({
  storage: posterStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: imageFilter,
}).single("poster");

// Configure disk storage for Profile Photos
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profileUploads);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const userId = req.user?._id ? req.user._id.toString() : "user";
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e6);
    cb(null, `profile-${userId}-${uniqueSuffix}${ext}`);
  },
});

// Single profile photo upload (2MB limit, jpg/jpeg/png/webp)
// Accepts either field name "photo" or "profilePhoto"
const profileMulter = multer({
  storage: profileStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: imageFilter,
});

const uploadProfilePhoto = (req, res, next) => {
  profileMulter.fields([
    { name: "photo", maxCount: 1 },
    { name: "profilePhoto", maxCount: 1 },
  ])(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        const customErr = new Error("File too large. Maximum allowed size for profile photo is 2MB.");
        customErr.statusCode = 400;
        return next(customErr);
      }
      return next(err);
    }
    // Normalize req.file from req.files
    if (req.files) {
      if (req.files.photo && req.files.photo.length > 0) {
        req.file = req.files.photo[0];
      } else if (req.files.profilePhoto && req.files.profilePhoto.length > 0) {
        req.file = req.files.profilePhoto[0];
      }
    }
    next();
  });
};

// Filter strictly for Certificate Templates: max 5MB, ONLY jpg/png
const certTemplateFilter = (req, file, cb) => {
  const allowedExts = /jpeg|jpg|png/;
  const mimeType = allowedExts.test(file.mimetype);
  const extName  = allowedExts.test(path.extname(file.originalname).toLowerCase());

  if (mimeType && extName) {
    return cb(null, true);
  }
  const err = new Error("Invalid file type. Only JPG and PNG image files are allowed for certificate templates.");
  err.statusCode = 400;
  cb(err);
};

// Disk storage for Certificate Templates
const certTemplateStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, certTemplateUploads);
  },
  filename: (req, file, cb) => {
    const eventId = req.params.id || req.params.eventId || "event";
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e6);
    cb(null, `template-${eventId}-${uniqueSuffix}${ext}`);
  },
});

const uploadCertTemplateMulter = multer({
  storage: certTemplateStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: certTemplateFilter,
});

const uploadCertTemplate = (req, res, next) => {
  uploadCertTemplateMulter.single("template")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        const customErr = new Error("File too large. Maximum allowed size for certificate template is 5MB.");
        customErr.statusCode = 400;
        return next(customErr);
      }
      return next(err);
    }
    next();
  });
};

module.exports = {
  uploadEventPhotos,
  uploadPoster,
  uploadProfilePhoto,
  uploadCertTemplate,
};
