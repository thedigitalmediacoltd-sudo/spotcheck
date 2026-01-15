import { recognizeText } from 'react-native-mlkit-ocr';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { supabase } from '@/lib/supabase';
import { PaywallError } from './paywall';

/**
 * Checks if user can perform a scan (Pro users have unlimited, Free users have 1/month)
 */
async function checkScanLimit(userId: string): Promise<void> {
  // Get user profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_pro, scan_count, last_scan_date')
    .eq('id', userId)
    .single();

  if (error) {
    if (__DEV__) {
      console.error('Profile fetch error:', error);
    }
    // If profile doesn't exist, allow scan (will be created on first scan)
    return;
  }

  // Pro users have unlimited scans
  if (profile?.is_pro) {
    return;
  }

  // Free users: Check monthly limit
  const now = new Date();
  const lastScanDate = profile?.last_scan_date
    ? new Date(profile.last_scan_date)
    : null;

  // Check if we're in a new month (reset scan count)
  const isNewMonth =
    !lastScanDate ||
    now.getMonth() !== lastScanDate.getMonth() ||
    now.getFullYear() !== lastScanDate.getFullYear();

  if (isNewMonth) {
    // Reset scan count for new month
    await supabase
      .from('profiles')
      .update({
        scan_count: 0,
        last_scan_date: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('id', userId);
    return; // Allow scan
  }

  // Check if user has exceeded monthly limit
  const scanCount = profile?.scan_count || 0;
  if (scanCount >= 1) {
    throw new PaywallError('You have reached your monthly scan limit. Upgrade to Pro for unlimited scans.');
  }
}

/**
 * Increments the scan count after a successful scan
 */
async function incrementScanCount(userId: string): Promise<void> {
  const now = new Date();

  // Get current profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('scan_count')
    .eq('id', userId)
    .single();

  const newCount = (profile?.scan_count || 0) + 1;

  await supabase
    .from('profiles')
    .update({
      scan_count: newCount,
      last_scan_date: now.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('id', userId);
}

/**
 * Scans a document image using MLKit OCR and extracts text.
 * CRITICAL: Deletes the image file immediately after extraction for privacy.
 * 
 * @param uri - The file URI of the image to scan
 * @param userId - The user ID to check scan limits
 * @returns The extracted text as a string
 * @throws PaywallError if user has exceeded free scan limit
 * @throws Error if OCR fails or file deletion fails
 */
export async function scanDocument(uri: string, userId?: string): Promise<string> {
  try {
    // Check scan limit before proceeding (if userId provided)
    if (userId) {
      await checkScanLimit(userId);
    }
    // Get image info to check size
    const imageInfo = await ImageManipulator.manipulateAsync(
      uri,
      [],
      { format: ImageManipulator.SaveFormat.JPEG }
    );

    // Optimize image: Resize to max 1080px width and compress to 0.7 quality
    // This reduces file size, speeds up OCR, and lowers data usage
    const maxWidth = 1080;
    const targetWidth = imageInfo.width > maxWidth ? maxWidth : imageInfo.width;
    
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: targetWidth } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );

    // Extract text using MLKit OCR
    const result = await recognizeText(manipulatedImage.uri);

    // Combine all text blocks into a single string
    const extractedText = result
      .map((block) => block.text)
      .join('\n')
      .trim();

    // CRITICAL: Delete the original file immediately after extraction
    try {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    } catch (deleteError) {
      if (__DEV__) {
        console.error('Failed to delete original file:', deleteError);
      }
      // Continue even if deletion fails, but log the error
    }

    // CRITICAL: Delete the manipulated file as well
    try {
      if (manipulatedImage.uri !== uri) {
        await FileSystem.deleteAsync(manipulatedImage.uri, { idempotent: true });
      }
    } catch (deleteError) {
      if (__DEV__) {
        console.error('Failed to delete manipulated file:', deleteError);
      }
      // Continue even if deletion fails, but log the error
    }

    // Increment scan count after successful scan (if userId provided)
    if (userId) {
      try {
        await incrementScanCount(userId);
      } catch (error) {
        // Don't fail the scan if count update fails
        if (__DEV__) {
          console.error('Failed to increment scan count:', error);
        }
      }
    }

    return extractedText;
  } catch (error) {
    // Ensure files are deleted even if OCR fails
    try {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    } catch (deleteError) {
      if (__DEV__) {
        console.error('Failed to delete file after OCR error:', deleteError);
      }
    }

    throw new Error(`OCR scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
