// Meta Graph API helpers (Facebook Pages / Instagram professional accounts)

export const GRAPH = 'https://graph.facebook.com/v25.0';

export interface MetaPage {
  id: string;
  name: string;
  access_token: string;
  picture?: string;
  instagram?: { id: string; username?: string; profile_picture_url?: string };
}

const PAGE_FIELDS = 'id,name,access_token,picture{url},instagram_business_account{id,username,profile_picture_url}';

function toMetaPage(p: any): MetaPage {
  return {
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
  };
}

/** Page ids the user selected in Facebook Login, read from the token's granular scopes. */
async function grantedPageIds(userAccessToken: string): Promise<string[]> {
  const appToken = `${Deno.env.get('META_APP_ID')}|${Deno.env.get('META_APP_SECRET')}`;
  const res = await fetch(
    `${GRAPH}/debug_token?input_token=${encodeURIComponent(userAccessToken)}&access_token=${encodeURIComponent(appToken)}`
  );
  const body = await res.json();
  const scopes: { scope: string; target_ids?: string[] }[] = body.data?.granular_scopes ?? [];
  return scopes.find((s) => s.scope === 'pages_show_list')?.target_ids ?? [];
}

/**
 * Pages the user granted to the app, with their linked Instagram professional account.
 * /me/accounts returns nothing for Pages owned by a Business portfolio, so we fall back to
 * the Page ids granted in Facebook Login (granular scopes) and read each Page directly.
 */
export async function listPages(userAccessToken: string): Promise<MetaPage[]> {
  const res = await fetch(`${GRAPH}/me/accounts?fields=${encodeURIComponent(PAGE_FIELDS)}&limit=100&access_token=${userAccessToken}`);
  const body = await res.json();
  if (body.error) throw new Error(body.error.message);
  const pages: MetaPage[] = (body.data ?? []).map(toMetaPage);
  if (pages.length > 0) return pages;

  const ids = await grantedPageIds(userAccessToken);
  const direct = await Promise.all(
    ids.map(async (id) => {
      const r = await fetch(`${GRAPH}/${id}?fields=${encodeURIComponent(PAGE_FIELDS)}&access_token=${userAccessToken}`);
      const page = await r.json();
      return page.error || !page.access_token ? null : toMetaPage(page);
    })
  );
  return direct.filter((p): p is MetaPage => p !== null);
}
