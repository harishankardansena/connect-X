const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let folder = 'chatapp/media';
    let resource_type = 'auto';

    if (file.mimetype.startsWith('image/')) folder = 'chatapp/images';
    else if (file.mimetype.startsWith('video/')) folder = 'chatapp/videos';
    else folder = 'chatapp/documents';

    return {
      folder,
      resource_type,
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'pdf', 'doc', 'docx', 'zip'],
      transformation: file.mimetype.startsWith('image/') ? [{ quality: 'auto', fetch_format: 'auto' }] : undefined,
    };
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/quicktime',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/zip',
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('File type not supported'), false);
  },
});

module.exports = { cloudinary, upload };
