import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { provider: string } }
) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const provider = params.provider;

  if (!code) {
    // Return OAuth initiation URL if no code is present
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/${provider}`;
    
    const providerAuthUrls: Record<string, string> = {
      google_ads: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=https://www.googleapis.com/auth/adwords&access_type=offline`,
      meta_ads: `https://www.facebook.com/v19.0/dialog/oauth?client_id=${process.env.META_CLIENT_ID}&redirect_uri=${redirectUri}&scope=ads_read,read_insights`,
      hubspot: `https://app.hubspot.com/oauth/authorize?client_id=${process.env.HUBSPOT_CLIENT_ID}&redirect_uri=${redirectUri}&scope=crm.objects.contacts.read%20crm.objects.deals.read`
    };

    const authUrl = providerAuthUrls[provider];
    if (authUrl) {
      return NextResponse.redirect(authUrl);
    }
    return NextResponse.json({ error: `Unsupported provider: ${provider}` }, { status: 400 });
  }

  // Handle OAuth code exchange and save tokens to tenant_connectors table
  try {
    // Mock token exchange response for staging
    return NextResponse.redirect(
      new URL(`/command-center?status=connected&provider=${provider}`, request.url)
    );
  } catch (error) {
    return NextResponse.json({ error: 'OAuth exchange failed' }, { status: 500 });
  }
}
