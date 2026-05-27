import { NextResponse } from 'next/server';

// Proxy endpoint to fetch WhatsApp profile pictures from Meta Graph API
// This avoids CORS issues when calling from the client side
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phoneNumber = searchParams.get('phone');
  const accessToken = searchParams.get('token');

  if (!phoneNumber || !accessToken) {
    return NextResponse.json({ error: 'Missing phone or token' }, { status: 400 });
  }

  // Strip non-digits from phone number
  const cleanPhone = phoneNumber.replace(/\D/g, '');

  try {
    // Step 1: Get the WhatsApp contact ID from Meta
    const contactResponse = await fetch(
      `https://graph.facebook.com/v20.0/${cleanPhone}/`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (!contactResponse.ok) {
      // If direct contact lookup fails, try profile picture endpoint
      const profilePicResponse = await fetch(
        `https://graph.facebook.com/v20.0/${cleanPhone}/picture?type=large&redirect=false`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (profilePicResponse.ok) {
        const picData = await profilePicResponse.json();
        if (picData.data?.url) {
          return NextResponse.json({ profilePicUrl: picData.data.url });
        }
      }

      return NextResponse.json({ profilePicUrl: null });
    }

    const contactData = await contactResponse.json();
    
    // Step 2: Try to get profile picture
    if (contactData.id) {
      const picResponse = await fetch(
        `https://graph.facebook.com/v20.0/${contactData.id}/picture?type=large&redirect=false`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (picResponse.ok) {
        const picData = await picResponse.json();
        if (picData.data?.url) {
          return NextResponse.json({ profilePicUrl: picData.data.url });
        }
      }
    }

    return NextResponse.json({ profilePicUrl: null });
  } catch (error) {
    console.error('Error fetching WhatsApp profile picture:', error);
    return NextResponse.json({ profilePicUrl: null });
  }
}
