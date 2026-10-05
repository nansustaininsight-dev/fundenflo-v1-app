import * as ClipboardModule from 'react-native/Libraries/Components/Clipboard/Clipboard';

export async function copyText(value: string) {
  try {
    const native = ClipboardModule as { default?: { setString: (text: string) => void } };
    if (!native.default) return false;
    native.default.setString(value);
    return true;
  } catch {
    return false;
  }
}
