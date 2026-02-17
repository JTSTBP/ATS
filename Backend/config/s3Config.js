const AWS = require('aws-sdk'); // Configured for multer-s3 v2
const multerS3 = require('multer-s3');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Check if AWS credentials are configured
const hasAWSCredentials = !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_REGION &&
    process.env.AWS_S3_BUCKET_NAME &&
    process.env.AWS_ACCESS_KEY_ID !== 'your_access_key_here'
);

console.log('--- S3 Config Debug ---');
console.log('AWS_ACCESS_KEY_ID exists:', !!process.env.AWS_ACCESS_KEY_ID);
console.log('AWS_SECRET_ACCESS_KEY exists:', !!process.env.AWS_SECRET_ACCESS_KEY);
console.log('AWS_REGION:', process.env.AWS_REGION);
console.log('AWS_S3_BUCKET_NAME:', process.env.AWS_S3_BUCKET_NAME);
console.log('hasAWSCredentials:', hasAWSCredentials);
console.log('-----------------------');

let s3 = null;
let resumeStorage = null;
let offerLetterStorage = null;
let profilePhotoStorage = null;
let clientLogoStorage = null;

if (hasAWSCredentials) {
    // Configure AWS
    AWS.config.update({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION
    });

    s3 = new AWS.S3();

    // S3 Storage for Resumes
    resumeStorage = multerS3({
        s3: s3,
        bucket: process.env.AWS_S3_BUCKET_NAME,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: function (req, file, cb) {
            const fileName = `resumes/${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
            cb(null, fileName);
        }
    });

    // S3 Storage for Offer Letters
    offerLetterStorage = multerS3({
        s3: s3,
        bucket: process.env.AWS_S3_BUCKET_NAME,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: function (req, file, cb) {
            const fileName = `offers/offer-${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
            cb(null, fileName);
        }
    });

    // S3 Storage for Profile Photos
    profilePhotoStorage = multerS3({
        s3: s3,
        bucket: process.env.AWS_S3_BUCKET_NAME,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: function (req, file, cb) {
            const fileName = `photos/photo-${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
            cb(null, fileName);
        }
    });

    // S3 Storage for Client Logos
    clientLogoStorage = multerS3({
        s3: s3,
        bucket: process.env.AWS_S3_BUCKET_NAME,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: function (req, file, cb) {
            const fileName = `logos/logo-${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
            cb(null, fileName);
        }
    });

    console.log('✅ AWS S3 configured successfully');
} else {
    console.warn('⚠️  AWS credentials not configured. Falling back to local storage.');
    console.warn('⚠️  Add AWS credentials to .env to enable S3 uploads.');

    // Fallback to local storage
    resumeStorage = multer.diskStorage({
        destination: (req, file, cb) => {
            const dir = "uploads/resumes/";
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            cb(null, dir);
        },
        filename: (req, file, cb) => {
            cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`);
        }
    });

    offerLetterStorage = multer.diskStorage({
        destination: (req, file, cb) => {
            const dir = "uploads/offers/";
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            cb(null, dir);
        },
        filename: (req, file, cb) => {
            cb(null, `offer-${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`);
        }
    });

    profilePhotoStorage = multer.diskStorage({
        destination: (req, file, cb) => {
            const dir = "uploads/photos/";
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            cb(null, dir);
        },
        filename: (req, file, cb) => {
            cb(null, `photo-${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`);
        }
    });

    clientLogoStorage = multer.diskStorage({
        destination: (req, file, cb) => {
            const dir = "uploads/logos/";
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            cb(null, dir);
        },
        filename: (req, file, cb) => {
            cb(null, `logo-${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`);
        }
    });
}


// Helper to generate Signed URL
const getSignedUrl = (fileUrl) => {
    if (!fileUrl || !s3) return fileUrl;

    // Check if it's an S3 URL
    if (fileUrl.includes('amazonaws.com')) {
        try {
            // Use URL API for robust parsing
            const urlObj = new URL(fileUrl);

            // Extract Key from pathname (comes with leading /)
            // decodeURIComponent is CRITICAL for keys with spaces/special chars
            let key = decodeURIComponent(urlObj.pathname.substring(1));

            // Handle Path-Style URLs (e.g. s3.region.amazonaws.com/bucket-name/key)
            if (urlObj.hostname.startsWith('s3.') && !urlObj.hostname.startsWith(process.env.AWS_S3_BUCKET_NAME)) {
                const bucketName = process.env.AWS_S3_BUCKET_NAME;
                if (key.startsWith(bucketName + '/')) {
                    key = key.substring(bucketName.length + 1);
                }
            }

            if (key) {
                // Generate Signed URL (valid for 1 hour)
                const signedUrl = s3.getSignedUrl('getObject', {
                    Bucket: process.env.AWS_S3_BUCKET_NAME,
                    Key: key,
                    Expires: 60 * 60 // 1 hour
                });
                return signedUrl;
            }
        } catch (error) {
            console.error("Error generating signed URL:", error);
            return fileUrl;
        }
    }

    return fileUrl; // Return original if not S3 or error
};

module.exports = {
    s3,
    resumeStorage,
    offerLetterStorage,
    profilePhotoStorage,
    clientLogoStorage,
    hasAWSCredentials,
    getSignedUrl
};
