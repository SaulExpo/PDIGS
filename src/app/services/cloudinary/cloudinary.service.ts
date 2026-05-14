import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

type CloudinaryUploadResponse = {
  secure_url?: string;
  error?: {
    message?: string;
  };
};

@Injectable({
  providedIn: 'root'
})
export class CloudinaryService {
  private readonly maxImageSizeBytes = 10 * 1024 * 1024;

  async uploadImage(file: File): Promise<string> {
    this.validateFile(file);

    const cloudName = environment.cloudinary?.cloudName;
    const uploadPreset = environment.cloudinary?.uploadPreset;

    if (!cloudName || !uploadPreset) {
      throw new Error('Cloudinary is not configured.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });

    const data = await response.json() as CloudinaryUploadResponse;

    if (!response.ok || !data.secure_url) {
      throw new Error(data.error?.message || 'Could not upload image to Cloudinary.');
    }

    return data.secure_url;
  }

  private validateFile(file: File) {
    if (!file.type.startsWith('image/')) {
      throw new Error('Only image files are allowed.');
    }

    if (file.size > this.maxImageSizeBytes) {
      throw new Error('Image must be 10 MB or smaller.');
    }
  }
}
