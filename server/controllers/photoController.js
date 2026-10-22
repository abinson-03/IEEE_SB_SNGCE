const path = require("path");
const fs   = require("fs");
const EventPhoto = require("../models/EventPhoto");
const Event      = require("../models/Event");
const AuditLog   = require("../models/AuditLog");
const { notifyChapterMembers } = require("../utils/notify");

/**
 * POST /api/events/:id/photos
 * Upload photos for a completed or published event.
 * Only ExeCom / Chapter Admin who owns the unit or created the event can upload.
 * Multi-file handled by multer (uploadEventPhotos middleware).
 */
const uploadPhotos = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate("unit", "name");
    if (!event) {
      const err = new Error("Event not found.");
      err.statusCode = 404;
      return next(err);
    }

    if (!req.files || req.files.length === 0) {
      const err = new Error("Please select at least one photo (max 20 per batch, max 5MB each).");
      err.statusCode = 400;
      return next(err);
    }

    const { caption = "", lat, lng } = req.body;
    const geoLocation = {
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
    };

    // Store only relative URL path on disk — NEVER store binary in MongoDB
    const photoDocs = req.files.map((file) => ({
      event: event._id,
      uploadedBy: req.user._id,
      filename: file.filename,
      url: `/uploads/events/${file.filename}`,
      caption: caption.trim(),
      geoLocation,
    }));

    const inserted = await EventPhoto.insertMany(photoDocs);

    await AuditLog.create({
      action: "PHOTOS_UPLOADED",
      performedBy: req.user._id,
      targetType: "Event",
      targetId: event._id,
      meta: { eventTitle: event.title, count: inserted.length },
    }).catch(() => {});

    // Notify chapter members about newly published photos
    await notifyChapterMembers(
      event.unit?._id || event.unit,
      `New Photos: ${event.title}`,
      `Fresh event photos from "${event.title}" were added to the Gallery. Check them out!`,
      "photo",
      "/gallery"
    );

    res.status(201).json({
      success: true,
      message: `Successfully uploaded ${inserted.length} photo(s).`,
      count: inserted.length,
      data: inserted,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/gallery
 * Public paginated gallery view: returns events with their photos count and thumbnails.
 */
const getGallery = async (req, res, next) => {
  try {
    const { page = 1, limit = 12 } = req.query;

    // Aggregate photos grouped by event
    const albums = await EventPhoto.aggregate([
      {
        $group: {
          _id: "$event",
          photoCount: { $sum: 1 },
          photos: {
            $push: {
              _id: "$_id",
              url: "$url",
              caption: "$caption",
              isCover: "$isCover",
              uploadedAt: "$uploadedAt",
            },
          },
          latestUpload: { $max: "$uploadedAt" },
        },
      },
      { $sort: { latestUpload: -1 } },
      { $skip: (parseInt(page) - 1) * parseInt(limit) },
      { $limit: parseInt(limit) },
    ]);

    // Populate event details
    const eventIds = albums.map((a) => a._id);
    const events = await Event.find({ _id: { $in: eventIds } })
      .populate("unit", "name type")
      .select("title date venue unit");

    const eventMap = {};
    events.forEach((e) => { eventMap[e._id.toString()] = e; });

    const result = albums
      .filter((a) => eventMap[a._id.toString()])
      .map((a) => {
        const ev = eventMap[a._id.toString()];
        const coverPhotoObj = a.photos.find((p) => p.isCover) || a.photos[0];
        return {
          eventId: ev._id,
          title: ev.title,
          date: ev.date,
          venue: ev.venue,
          unit: ev.unit?.name || "SB",
          photoCount: a.photoCount,
          coverPhoto: coverPhotoObj?.url || "",
          previewThumbnails: a.photos.slice(0, 4).map((p) => p.url),
        };
      });

    res.status(200).json({
      success: true,
      count: result.length,
      page: parseInt(page),
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/gallery/recent?limit=3
 * For Home page "Recent Event Highlights" thumbnail strip.
 */
const getRecentHighlights = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 3;

    const albums = await EventPhoto.aggregate([
      {
        $group: {
          _id: "$event",
          photoCount: { $sum: 1 },
          photos: {
            $push: {
              _id: "$_id",
              url: "$url",
              caption: "$caption",
              isCover: "$isCover",
              uploadedAt: "$uploadedAt",
            },
          },
          latestUpload: { $max: "$uploadedAt" },
        },
      },
      { $sort: { latestUpload: -1 } },
      { $limit: limit },
    ]);

    const eventIds = albums.map((a) => a._id);
    const events = await Event.find({ _id: { $in: eventIds } })
      .populate("unit", "name")
      .select("title date unit");

    const eventMap = {};
    events.forEach((e) => { eventMap[e._id.toString()] = e; });

    const highlights = albums
      .filter((a) => eventMap[a._id.toString()])
      .map((a) => {
        const ev = eventMap[a._id.toString()];
        const coverPhotoObj = a.photos.find((p) => p.isCover) || a.photos[0];
        return {
          eventId: ev._id,
          title: ev.title,
          date: ev.date,
          unit: ev.unit?.name,
          photoCount: a.photoCount,
          coverPhoto: coverPhotoObj?.url || "",
          thumbnails: a.photos.slice(0, 3).map((p) => p.url),
        };
      });

    res.status(200).json({ success: true, count: highlights.length, data: highlights });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/gallery/:eventId
 * Returns all photos for a single event.
 */
const getEventPhotos = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId).populate("unit", "name");
    if (!event) {
      const err = new Error("Event not found.");
      err.statusCode = 404;
      return next(err);
    }

    const photos = await EventPhoto.find({ event: event._id })
      .populate("uploadedBy", "name")
      .sort({ isCover: -1, uploadedAt: -1 });

    res.status(200).json({
      success: true,
      event: {
        _id: event._id,
        title: event.title,
        date: event.date,
        venue: event.venue,
        unit: event.unit?.name,
      },
      count: photos.length,
      data: photos,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/gallery/photos/:photoId
 * Update photo caption and/or set as event cover photo.
 * Restricted to ExeCom, Chapter Admin, or Superadmin.
 */
const updatePhoto = async (req, res, next) => {
  try {
    const { photoId } = req.params;
    const { caption, isCover } = req.body;

    const photo = await EventPhoto.findById(photoId).populate("event");
    if (!photo) {
      const err = new Error("Photo not found.");
      err.statusCode = 404;
      return next(err);
    }

    if (typeof caption === "string") {
      photo.caption = caption.trim().slice(0, 200);
    }

    if (isCover === true) {
      // Clear previous cover for this event
      await EventPhoto.updateMany(
        { event: photo.event?._id || photo.event, _id: { $ne: photo._id } },
        { $set: { isCover: false } }
      );
      photo.isCover = true;
    } else if (isCover === false) {
      photo.isCover = false;
    }

    await photo.save();

    await AuditLog.create({
      action: "PHOTO_UPDATED",
      performedBy: req.user._id,
      targetType: "Event",
      targetId: photo.event?._id || photo.event,
      meta: { photoId: photo._id, caption: photo.caption, isCover: photo.isCover },
    }).catch(() => {});

    res.status(200).json({
      success: true,
      message: "Photo updated successfully.",
      data: photo,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/gallery/photos/:photoId
 * Delete a photo from disk and database.
 * Restricted to ExeCom, Chapter Admin, or Superadmin.
 */
const deletePhoto = async (req, res, next) => {
  try {
    const { photoId } = req.params;
    const photo = await EventPhoto.findById(photoId).populate("event");
    if (!photo) {
      const err = new Error("Photo not found.");
      err.statusCode = 404;
      return next(err);
    }

    // Attempt to remove file from disk safely
    if (photo.filename) {
      const filePath = path.join(__dirname, "..", "uploads", "events", photo.filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (unlinkErr) {
          console.warn("Failed to delete photo from disk:", unlinkErr.message);
        }
      }
    }

    const eventId = photo.event?._id || photo.event;
    const wasCover = photo.isCover;

    await EventPhoto.findByIdAndDelete(photoId);

    // If deleted photo was cover, promote the newest remaining photo
    if (wasCover) {
      const nextCover = await EventPhoto.findOne({ event: eventId }).sort({ uploadedAt: -1 });
      if (nextCover) {
        nextCover.isCover = true;
        await nextCover.save();
      }
    }

    await AuditLog.create({
      action: "PHOTO_DELETED",
      performedBy: req.user._id,
      targetType: "Event",
      targetId: eventId,
      meta: { filename: photo.filename, caption: photo.caption },
    }).catch(() => {});

    res.status(200).json({
      success: true,
      message: "Photo deleted successfully.",
      data: { photoId },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadPhotos,
  getGallery,
  getRecentHighlights,
  getEventPhotos,
  updatePhoto,
  deletePhoto,
};
