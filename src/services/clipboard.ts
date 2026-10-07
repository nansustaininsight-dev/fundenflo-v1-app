import * as Clipboard from 'expo-clipboard';

export async function copyText(value: string) {
  try {
    return await Clipboard.setStringAsync(value);
  } catch {
    return false;
  }
}
