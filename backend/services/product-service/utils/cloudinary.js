import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function ensureCloudinaryConfig() {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    const error = new Error("Cloudinary environment variables are required for image uploads");
    error.statusCode = 503;
    throw error;
  }
}

export function uploadImage(file) {
  ensureCloudinaryConfig();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: process.env.CLOUDINARY_FOLDER || "ecommerce/products", resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        return resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(file.buffer);
  });
}

export async function uploadImages(files = []) {
  const uploaded = [];
  try {
    for (const file of files) uploaded.push(await uploadImage(file));
    return uploaded;
  } catch (error) {
    await deleteImages(uploaded);
    throw error;
  }
}

export async function deleteImages(images = []) {
  const publicIds = images.map((image) => image.publicId).filter(Boolean);
  if (publicIds.length === 0) return;

  const results = await Promise.allSettled(
    publicIds.map((publicId) => cloudinary.uploader.destroy(publicId, { resource_type: "image" }))
  );
  for (const result of results) {
    if (result.status === "rejected") {
      console.error("Could not delete a Cloudinary image:", result.reason?.message);
    }
  }
}
