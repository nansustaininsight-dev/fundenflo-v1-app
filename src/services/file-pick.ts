import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

import { ACCEPTED_TYPES } from '@/constants/documents';
import { ApiError } from '@/services/api';
import type { PickedFile } from '@/services/documents';

/** System file picker (PDF / JPG / PNG). Resolves null when the borrower cancels. */
export async function pickFile(): Promise<PickedFile | null> {
  const res = await DocumentPicker.getDocumentAsync({ type: ACCEPTED_TYPES, copyToCacheDirectory: true, base64: false });
  if (res.canceled || !res.assets?.[0]) return null;
  const a = res.assets[0];
  return { uri: a.uri, name: a.name, size: a.size, mimeType: a.mimeType, file: a.file };
}

/** Camera capture of a paper document. Resolves null on cancel; throws when camera access is denied. */
export async function scanWithCamera(): Promise<PickedFile | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    throw new ApiError(perm.canAskAgain
      ? 'Camera Access Is Needed To Scan. You Can Upload A File Instead.'
      : 'Camera Access Is Off. Turn It On In Settings, Or Upload A File Instead.');
  }
  const res = await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 0.7 });
  if (res.canceled || !res.assets?.[0]) return null;
  const a = res.assets[0];
  return { uri: a.uri, name: a.fileName ?? `scan-${Date.now()}.jpg`, size: a.fileSize, mimeType: a.mimeType ?? 'image/jpeg', file: a.file };
}
