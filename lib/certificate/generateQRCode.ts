import QRCode from 'qrcode';

/**
 * Generates a high-resolution QR Code base64 data URL for a given text.
 * @param text The URL or verification text to encode.
 */
export async function generateQRCode(text: string): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 320, // High resolution for scanning
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    return dataUrl;
  } catch (err) {
    console.error('Failed to generate QR Code:', err);
    throw new Error('QR Code generation failed');
  }
}
