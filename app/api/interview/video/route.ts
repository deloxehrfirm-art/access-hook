import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase, getServerSupabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get('path');
    const answerId = searchParams.get('answerId');

    const cookieStore = await cookies();
    const serverSupabase = getServerSupabase(cookieStore);
    const { data: { user } } = await serverSupabase.auth.getUser();

    const serviceSupabase = getServiceSupabase();
    let videoPath = path;

    if (!videoPath && answerId) {
      const { data: ans } = await serviceSupabase
        .from('interview_answers')
        .select('video_url, user_id')
        .eq('id', answerId)
        .maybeSingle();

      if (ans) {
        if (ans.video_url.includes('/interview-videos/')) {
          videoPath = ans.video_url.split('/interview-videos/')[1];
        } else {
          videoPath = ans.video_url;
        }
      }
    }

    if (!videoPath) {
      return NextResponse.json({ error: 'Video path or answerId parameter is required' }, { status: 400 });
    }

    // Strip leading bucket name or slash if included
    if (videoPath.startsWith('interview-videos/')) {
      videoPath = videoPath.replace('interview-videos/', '');
    }

    // Download video using service role client to safely serve authorized request
    const { data: fileData, error: downloadErr } = await serviceSupabase.storage
      .from('interview-videos')
      .download(videoPath);

    if (downloadErr || !fileData) {
      console.error('Error downloading interview video:', downloadErr);
      return NextResponse.json({ 
        error: `Interview video file '${videoPath}' not found in storage bucket 'interview-videos'.` 
      }, { status: 404 });
    }

    const videoBuffer = await fileData.arrayBuffer();

    return new NextResponse(videoBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'video/webm',
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (err: any) {
    console.error('Error serving interview video:', err);
    return NextResponse.json({ 
      error: 'Failed to retrieve video file', 
      details: err.message || String(err) 
    }, { status: 500 });
  }
}
