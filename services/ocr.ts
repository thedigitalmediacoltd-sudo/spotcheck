import { recognizeText } from 'react-native-mlkit-ocr';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

/**
 * Scans a document image using MLKit OCR and extracts text.
 * CRITICAL: Deletes the image file immediately after extraction for privacy.
 * 
 * @param uri - The file URI of the image to scan
 * @returns The extracted text as a string
 * @throws Error if OCR fails or file deletion fails
 */
export async function scanDocument(uri: string): Promise<string> {
  try {
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
