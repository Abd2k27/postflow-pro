// Meta Graph API helpers (Facebook Pages / Instagram professional accounts)

export const GRAPH = 'https://graph.facebook.com/v25.0';

export interface MetaPage {
  id: string;
  name: string;
  access_token: string;
  picture?: string;
  instagram?: { id: string; username?: string; profile_picture_url?: string };
}

/** Pages the user granted to the app, with their linked Instagram professional account. */
export async function listPages(userAccessToken: string): Promise<MetaPage[]> {
  const fields = 'id,name,access_token,picture{url},instagram_business_account{id,username,profile_picture_url}';
  const res = await fetch(`${GRAPH}/me/accounts?fields=${encodeURIComponent(fields)}&limit=100&access_token=${userAccessToken}`);
  const body = await res.json();
  if (body.error) throw new Error(body.error.message);
  return (body.data ?? []).map((p: any) => ({
    id: p.id,
    name: p.name,
    access_token: p.access_token,
    picture: p.picture?.data?.url,
    instagram: p.instagram_business_account
      ? {
          id: p.instagram_business_account.id,
          username: p.instagram_business_account.username,
          profile_picture_url: p.instagram_business_account.profile_picture_url,
        }
      : undefined,
  }));
}
