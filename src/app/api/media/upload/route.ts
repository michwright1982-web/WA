import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const phoneNumberId = formData.get('phoneNumberId') as string | null;
    const accessToken = formData.get('accessToken') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 1. Prepare clean filename and dynamic fallback
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    let mediaUrl = '';

    // Generate in-memory base64 data URI as fallback for read-only / serverless filesystems
    const fileBase64 = buffer.toString('base64');
    const dataUri = `data:${file.type || 'application/pdf'};base64,${fileBase64}`;

    try {
      // Attempt to save file locally in public/uploads/ (works in writable environments)
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, safeName);
      await writeFile(filePath, buffer);
      mediaUrl = `/uploads/${safeName}`;
    } catch (err) {
      console.warn('Unable to write to local filesystem (likely read-only serverless environment). Falling back to in-memory Data URI:', err);
      mediaUrl = dataUri;
    }
    let mediaId: string | undefined = undefined;

    // 2. If valid Meta credentials are provided, upload to Meta
    const isMockToken = !accessToken || accessToken.startsWith('EAAGb...') || accessToken.length < 20;

    if (phoneNumberId && accessToken && !isMockToken) {
      console.log('Uploading file to Meta API for phoneNumberId:', phoneNumberId);
      
      const metaUrl = `https://graph.facebook.com/v20.0/${phoneNumberId}/media`;
      const metaFormData = new FormData();
      metaFormData.append('messaging_product', 'whatsapp');
      
      // Use standard web File from the parsed buffer
      const fileBlob = new Blob([buffer], { type: file.type || 'application/pdf' });
      metaFormData.append('file', fileBlob, safeName);
      metaFormData.append('type', file.type || 'application/pdf');

      try {
        const response = await fetch(metaUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          },
          body: metaFormData
        });

        const data = await response.json();
        console.log('Meta upload media response:', data);

        if (response.ok && data.id) {
          mediaId = data.id;
        } else {
          console.error('Meta upload failed:', data);
        }
      } catch (err) {
        console.error('Error contacting Meta media API:', err);
      }
    }

    return NextResponse.json({
      success: true,
      mediaUrl,
      mediaId
    }, { status: 200 });

  } catch (error: any) {
    console.error('Upload route error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error.' }, { status: 500 });
  }
}
