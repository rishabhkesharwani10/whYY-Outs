
const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1920; // Using a square aspect ratio for max dimensions is safer for various image orientations
const MIME_TYPE = "image/jpeg";
const QUALITY = 0.8;

export const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = URL.createObjectURL(file);

    image.onload = () => {
      let { width, height } = image;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height = Math.round(height * (MAX_WIDTH / width));
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width = Math.round(width * (MAX_HEIGHT / height));
          height = MAX_HEIGHT;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return reject(new Error('Could not get 2D canvas context'));
      }

      ctx.drawImage(image, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return reject(new Error('Canvas to Blob conversion failed'));
          }
          // Preserve original file name but change extension
          const originalName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
          const newFileName = `${originalName}.jpeg`;

          const newFile = new File([blob], newFileName, {
            type: MIME_TYPE,
            lastModified: Date.now(),
          });
          
          URL.revokeObjectURL(image.src); // Clean up memory
          resolve(newFile);
        },
        MIME_TYPE,
        QUALITY
      );
    };

    image.onerror = (error) => {
      URL.revokeObjectURL(image.src); // Clean up memory
      reject(error);
    };
  });
};
