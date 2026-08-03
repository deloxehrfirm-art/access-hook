import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { certificateConfig } from './certificateconfig';
import { generateQRCode } from './generateQRCode';
import { getServiceSupabase } from '@/lib/supabase';

interface GenerateCertificateParams {
  studentName: string;
  certificateId: string;
  awardDate: Date;
}

/**
 * Generates a beautiful PDF certificate with the template background, embedded fonts, and dynamic QR Code.
 */
export async function generateCertificate({
  studentName,
  certificateId,
  awardDate,
}: GenerateCertificateParams): Promise<Buffer> {
  const supabase = getServiceSupabase();
  const config = certificateConfig;
  
  // 1. Create PDF Document and setup page
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([config.canvas.width, config.canvas.height]);

  // 2. Load Canva template image from Supabase Storage
  let templateBuffer: ArrayBuffer | null = null;
  const bucketName = 'allcertification';

  try {
    const { data: files, error: listError } = await supabase.storage.from(bucketName).list('templates');
    let templateFilename = 'Deloxe Profesional Certificate.png';
    
    if (!listError && files && files.length > 0) {
      // Look for a file containing "Deloxe" and "Certificate" (handles optional spaces)
      const matched = files.find(f => 
        f.name.toLowerCase().includes('deloxe') && 
        f.name.toLowerCase().includes('certificate')
      );
      if (matched) {
        templateFilename = matched.name;
        console.log('Successfully matched certificate template in storage:', templateFilename);
      }
    }

    const { data, error: downloadError } = await supabase.storage
      .from(bucketName)
      .download(`templates/${templateFilename}`);

    if (downloadError) {
      throw downloadError;
    }
    
    if (data) {
      templateBuffer = await data.arrayBuffer();
    }
  } catch (err) {
    console.warn('Could not load certificate template image from Storage. Will draw an elegant vector fallback layout.', err);
  }

  // 3. Draw Background (Canva image template OR elegant fallback vector design)
  if (templateBuffer) {
    try {
      const isPng = true; // Supabase templates are typically PNG, try embedding as PNG first
      let templateImage;
      try {
        templateImage = await pdfDoc.embedPng(templateBuffer);
      } catch {
        // Fallback to JPG embedding if PNG parsing fails
        templateImage = await pdfDoc.embedJpg(templateBuffer);
      }
      page.drawImage(templateImage, {
        x: 0,
        y: 0,
        width: config.canvas.width,
        height: config.canvas.height,
      });
    } catch (embedErr) {
      console.error('Error embedding template image, drawing vector fallback...', embedErr);
      drawVectorFallback(page, config);
    }
  } else {
    drawVectorFallback(page, config);
  }

  // 4. Load Custom Fonts
  let fontGreatVibes: any = null;
  let fontSpaceGrotesk: any = null;
  let fontPlayfairDisplay: any = null;

  try {
    // Download and embed custom fonts from raw Google Fonts URLs
    const [gvBytes, sgBytes, pdBytes] = await Promise.all([
      fetch(config.urls.greatVibes).then(res => {
        if (!res.ok) throw new Error('Great Vibes load failed');
        return res.arrayBuffer();
      }),
      fetch(config.urls.spaceGrotesk).then(res => {
        if (!res.ok) throw new Error('Space Grotesk load failed');
        return res.arrayBuffer();
      }),
      fetch(config.urls.playfairDisplay).then(res => {
        if (!res.ok) throw new Error('Playfair Display load failed');
        return res.arrayBuffer();
      }),
    ]);

    fontGreatVibes = await pdfDoc.embedFont(gvBytes);
    fontSpaceGrotesk = await pdfDoc.embedFont(sgBytes);
    fontPlayfairDisplay = await pdfDoc.embedFont(pdBytes);
  } catch (fontErr) {
    console.warn('Failed to fetch custom fonts over network. Falling back to PDF Standard Fonts.', fontErr);
    // Graceful fallback to standard fonts
    fontGreatVibes = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    fontSpaceGrotesk = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    fontPlayfairDisplay = await pdfDoc.embedFont(StandardFonts.Helvetica);
  }

  // 5. Generate QR Code and Embed
  try {
    const verificationUrl = `https://ecosystem.deloxehr.com/verify/${certificateId}`;
    const qrCodeDataUrl = await generateQRCode(verificationUrl);
    
    // Extract base64 image data
    const base64Data = qrCodeDataUrl.split(',')[1];
    const qrBuffer = Buffer.from(base64Data, 'base64');
    const qrImage = await pdfDoc.embedPng(qrBuffer);

    // Coordinate conversion (Canva coordinates have 0,0 at Top-Left, pdf-lib has 0,0 at Bottom-Left)
    const qrY_pdf = config.canvas.height - config.qrCode.y - config.qrCode.height;

    // Draw QR Code (maintaining square ratio of 160x160 inside the bounding box)
    page.drawImage(qrImage, {
      x: config.qrCode.x,
      y: qrY_pdf + (config.qrCode.height - config.qrCode.width) / 2, // center square vertically
      width: config.qrCode.width,
      height: config.qrCode.width, // Draw as square
    });
  } catch (qrErr) {
    console.error('Failed to embed QR Code in certificate PDF:', qrErr);
  }

  // 6. Format Date string (e.g. July 11, 2026)
  const awardDateStr = awardDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  // 7. Render Student Name
  const nameConfig = config.studentName;
  const nameFontSize = nameConfig.fontSize;
  const nameWidth = fontGreatVibes.widthOfTextAtSize(studentName, nameFontSize);
  const nameX = nameConfig.x + (nameConfig.width - nameWidth) / 2; // Center horizontally
  const nameY_pdf = config.canvas.height - nameConfig.y - nameFontSize + 12; // Adjusted baseline

  page.drawText(studentName, {
    x: nameX,
    y: nameY_pdf,
    size: nameFontSize,
    font: fontGreatVibes,
    color: rgb(0, 0, 0),
  });

  // 8. Render Certificate ID
  const idConfig = config.certificateId;
  const idFontSize = idConfig.fontSize;
  const idY_pdf = config.canvas.height - idConfig.y - idFontSize;

  page.drawText(certificateId, {
    x: idConfig.x,
    y: idY_pdf,
    size: idFontSize,
    font: fontSpaceGrotesk,
    color: rgb(0, 0, 0),
  });

  // 9. Render Award Date
  const dateConfig = config.awardDate;
  const dateFontSize = dateConfig.fontSize;
  const dateTextWidth = fontPlayfairDisplay.widthOfTextAtSize(awardDateStr, dateFontSize);
  const dateX = dateConfig.x + dateConfig.width - dateTextWidth; // Align Right
  const dateY_pdf = config.canvas.height - dateConfig.y - dateFontSize;

  page.drawText(awardDateStr, {
    x: dateX,
    y: dateY_pdf,
    size: dateFontSize,
    font: fontPlayfairDisplay,
    color: rgb(0, 0, 0),
  });

  // 10. Save and return PDF bytes
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Draws an elegant fallback vector design directly onto the PDF if the Canva image template is unavailable.
 */
function drawVectorFallback(page: any, config: any) {
  const w = config.canvas.width;
  const h = config.canvas.height;

  // Background cream color
  page.drawRectangle({
    x: 0,
    y: 0,
    width: w,
    height: h,
    color: rgb(0.97, 0.98, 0.95), // Light off-white cream
  });

  // Double border borders
  // Primary outer border (deep forest green #1a2321)
  page.drawRectangle({
    x: 40,
    y: 40,
    width: w - 80,
    height: h - 80,
    borderColor: rgb(0.1, 0.14, 0.13),
    borderWidth: 6,
  });

  // Accent inner border (mint green / gold style)
  page.drawRectangle({
    x: 55,
    y: 55,
    width: w - 110,
    height: h - 110,
    borderColor: rgb(0.86, 0.94, 0.87),
    borderWidth: 2,
  });

  // Corner decorations
  const drawCorner = (cx: number, cy: number) => {
    page.drawRectangle({
      x: cx,
      y: cy,
      width: 30,
      height: 30,
      color: rgb(0.1, 0.14, 0.13),
    });
  };
  drawCorner(40, 40);
  drawCorner(w - 70, 40);
  drawCorner(40, h - 70);
  drawCorner(w - 70, h - 70);

  // Template Titles & Texts
  // Primary Title: "DELOXE HR ACADEMY"
  page.drawText('DELOXE HR ACADEMY', {
    x: 633,
    y: h - 220,
    size: 40,
    color: rgb(0.1, 0.14, 0.13),
  });

  // Subtitle: "PROFESSIONAL CERTIFICATE OF COMPLETION"
  page.drawText('PROFESSIONAL CERTIFICATE OF COMPLETION', {
    x: 633,
    y: h - 300,
    size: 24,
    color: rgb(0.4, 0.45, 0.42),
  });

  // Course statement
  page.drawText('This is proudly awarded to', {
    x: 633,
    y: h - 450,
    size: 20,
    color: rgb(0.4, 0.45, 0.42),
  });

  page.drawText('for successfully completing the final assessment and training requirements for', {
    x: 633,
    y: h - 720,
    size: 18,
    color: rgb(0.4, 0.45, 0.42),
  });

  page.drawText('Workplace Readiness Profession Development', {
    x: 633,
    y: h - 780,
    size: 26,
    color: rgb(0.1, 0.14, 0.13),
  });

  // Verification watermark
  page.drawText('Scan QR Code to Verify Authenticity', {
    x: 60,
    y: h - 1100,
    size: 14,
    color: rgb(0.5, 0.5, 0.5),
  });
}
