import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const certificateId = searchParams.get('id');

    if (!certificateId) {
      return NextResponse.json({ error: 'Certificate ID is required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Query the certificates table
    const { data: cert, error } = await supabase
      .from('certificates')
      .select('*')
      .or(`certificate_id.eq.${certificateId},id.eq.${certificateId},applicant_id.eq.${certificateId}`)
      .maybeSingle();

    if (error) {
      console.error('Error finding certificate in database:', error);
    }

    if (!cert) {
      return NextResponse.json({ error: `Certificate record '${certificateId}' not found in database.` }, { status: 404 });
    }

    const bucketName = 'allcertification';
    let pdfBuffer: ArrayBuffer | null = null;

    // 1. Primary retrieval: Download directly from allcertification storage bucket using real storage_path
    if (cert.storage_path) {
      const { data: fileData, error: downloadErr } = await supabase.storage
        .from(bucketName)
        .download(cert.storage_path);

      if (!downloadErr && fileData) {
        pdfBuffer = await fileData.arrayBuffer();
      } else if (downloadErr) {
        console.warn(`Storage download error for path '${cert.storage_path}':`, downloadErr.message);
      }
    }

    // 2. Secondary fallback: Fetch via pdf_url if storage_path was not downloadable
    if (!pdfBuffer && cert.pdf_url && cert.pdf_url.startsWith('http')) {
      try {
        const response = await fetch(cert.pdf_url);
        if (response.ok) {
          pdfBuffer = await response.arrayBuffer();
        }
      } catch (fetchErr) {
        console.warn('Failed to fetch certificate via pdf_url:', fetchErr);
      }
    }

    if (!pdfBuffer) {
      return NextResponse.json({ 
        error: `Certificate PDF file for '${certificateId}' was not found in storage bucket '${bucketName}'.` 
      }, { status: 404 });
    }

    // Return the PDF with proper content headers
    const viewInline = searchParams.get('view') === 'true';
    const filename = `${cert.certificate_id || 'certificate'}.pdf`;
    const contentDisposition = viewInline 
      ? `inline; filename="${filename}"`
      : `attachment; filename="${filename}"`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': contentDisposition,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err: any) {
    console.error('Error downloading certificate:', err);
    return NextResponse.json({ error: 'Failed to download certificate' }, { status: 500 });
  }
}
