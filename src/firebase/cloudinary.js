const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export async function uploadImage(file, folder = 'varsiq') {
  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary environment variables are missing.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: 'POST',
      body: formData,
    },
  );

  if (!response.ok) {
    throw new Error('Image upload failed.');
  }

  const data = await response.json();
  return data.secure_url;
}

export function optimizeCloudinaryImage(
  url,
  transformations = 'f_auto,q_auto,c_fill,w_1200',
) {
  if (!url || !url.includes('/upload/')) {
    return url;
  }

  return url.replace('/upload/', `/upload/${transformations}/`);
}
