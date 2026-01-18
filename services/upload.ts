import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { scanDocument } from './ocr';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { PaywallError } from './paywall';

export type UploadResult = {
  uri: string;
  type: 'image' | 'pdf';
  name: string;
  mimeType: string | null;
};

/**
 * Checks if user can upload documents (Pro users only)
 */
async function checkDocumentUploadPermission(userId: string): Promise<void> {
  // Get user profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_pro')
    .eq('id', userId)
    .single();

  if (error) {
    if (__DEV__) {
      console.error('Profile fetch error:', error);
    }
    // If profile doesn't exist, allow check (will be created)
    // But require pro for document upload
    throw new PaywallError('Document upload is a Pro feature. Upgrade to Pro to upload documents.');
  }

  // Pro users can upload documents
  if (profile?.is_pro) {
    return;
  }

  // Free users cannot upload documents
  throw new PaywallError('Document upload is a Pro feature. Upgrade to Pro to upload documents from your device.');
}

/**
 * Pick an image from the gallery or take a photo
 */
export async function pickImage(): Promise<UploadResult | null> {
  try {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Permission to access media library is required');
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1.0,
      allowsMultipleSelection: false,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      type: 'image',
      name: asset.fileName || `image_${Date.now()}.jpg`,
      mimeType: asset.mimeType || 'image/jpeg',
    };
  } catch (error) {
    if (__DEV__) {
      console.error('Image picker error:', error);
    }
    throw new Error(
      error instanceof Error ? error.message : 'Failed to pick image'
    );
  }
}

/**
 * Pick a document (PDF or image) from the file system
 * Requires Pro subscription
 * @param userId - The user ID to check pro status
 */
export async function pickDocument(userId?: string): Promise<UploadResult | null> {
  // Check pro status before allowing document picker
  if (userId) {
    await checkDocumentUploadPermission(userId);
  }

  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    const mimeType = asset.mimeType;
    const isPDF = mimeType === 'application/pdf' || asset.name?.endsWith('.pdf');
    const isImage = mimeType?.startsWith('image/') || 
                    /\.(jpg|jpeg|png|gif|webp)$/i.test(asset.name || '');

    if (!isPDF && !isImage) {
      throw new Error('Please select a PDF or image file');
    }

    return {
      uri: asset.uri,
      type: isPDF ? 'pdf' : 'image',
      name: asset.name || `document_${Date.now()}`,
      mimeType: mimeType || (isPDF ? 'application/pdf' : 'image/jpeg'),
    };
  } catch (error) {
    if (__DEV__) {
      console.error('Document picker error:', error);
    }
    throw new Error(
      error instanceof Error ? error.message : 'Failed to pick document'
    );
  }
}

/**
 * Process an uploaded file and extract text
 * For images: Uses OCR directly
 * For PDFs: Returns error (PDF processing requires additional setup)
 */
export async function processUploadedFile(
  file: UploadResult,
  userId?: string
): Promise<string> {
  if (file.type === 'pdf') {
    throw new Error(
      'PDF processing is currently not supported. Please convert to an image or use the camera to scan.'
    );
  }

  // For images, use the existing OCR function
  return await scanDocument(file.uri, userId);
}
