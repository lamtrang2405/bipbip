import { createHash } from "node:crypto";
import { after, NextResponse, userAgent, type NextRequest } from "next/server";
import { isPlacementKey, UUID_RE } from "@/lib/affiliate-config";
import { isAllowedAffiliateUrl } from "@/lib/affiliate-url";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/service";

const BOT_UA_RE = /bot|crawl|spider|preview|facebookexternalhit|zalo/i;
const DEDUPE_WINDOW_MS = 30_000;
const NO_INDEX_HEADERS = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
};

function redirectTo(url: string | URL) {
  return NextResponse.redirect(url, { status: 302, headers: NO_INDEX_HEADERS });
}

function vnDay() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
}

/** Hash theo ngày để không lưu IP thô và không nối được lượt click giữa các ngày. */
function hashIp(ip: string): string | null {
  const salt = process.env.AFFILIATE_IP_SALT?.trim() || process.env.ADMIN_SESSION_SECRET?.trim();
  if (!ip || !salt) return null;
  return createHash("sha256").update(`${ip}|${salt}|${vnDay()}`).digest("hex");
}

function clientIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip")?.trim() || "";
}

type LinkRow = { id: string; target_url: string; is_active: boolean; starts_at: string | null; ends_at: string | null };

function isLive(link: LinkRow, now: number) {
  if (!link.is_active) return false;
  if (link.starts_at && Date.parse(link.starts_at) > now) return false;
  if (link.ends_at && Date.parse(link.ends_at) <= now) return false;
  return true;
}

export async function GET(req: NextRequest, ctx: RouteContext<"/go/[id]">) {
  const home = new URL("/", req.url);
  const { id } = await ctx.params;
  const query = req.nextUrl.searchParams;
  const placement = query.get("p");
  const storyRaw = query.get("s");
  const chapterRaw = query.get("c");
  const chapterNumber = chapterRaw === null ? null : Number(chapterRaw);

  if (
    !UUID_RE.test(id) ||
    !isPlacementKey(placement) ||
    (storyRaw !== null && !UUID_RE.test(storyRaw)) ||
    (chapterNumber !== null && (!Number.isInteger(chapterNumber) || chapterNumber < 1 || chapterNumber > 1_000_000))
  ) {
    return redirectTo(home);
  }

  const service = getSupabaseServiceRoleClient();
  if (!service) return redirectTo(home);

  const { data, error } = await service
    .from("affiliate_links")
    .select("id, target_url, is_active, starts_at, ends_at")
    .eq("id", id)
    .maybeSingle();
  const link = data as LinkRow | null;
  if (error || !link || !isLive(link, Date.now()) || !isAllowedAffiliateUrl(link.target_url)) {
    return redirectTo(home);
  }

  const ua = req.headers.get("user-agent") ?? "";
  const isBot = !ua || userAgent(req).isBot || BOT_UA_RE.test(ua);
  const ipHash = hashIp(clientIp(req));

  after(async () => {
    try {
      if (ipHash) {
        const { data: recent } = await service
          .from("affiliate_clicks")
          .select("id")
          .eq("ip_hash", ipHash)
          .eq("link_id", link.id)
          .gte("created_at", new Date(Date.now() - DEDUPE_WINDOW_MS).toISOString())
          .limit(1);
        if (recent?.length) return;
      }
      const row = {
        link_id: link.id,
        placement,
        story_id: storyRaw,
        chapter_number: chapterNumber,
        ip_hash: ipHash,
        is_bot: isBot,
      };
      const { error: insertError } = await service.from("affiliate_clicks").insert(row);
      if (insertError?.code === "23503") {
        await service.from("affiliate_clicks").insert({ ...row, story_id: null });
      } else if (insertError) {
        console.warn("[affiliate] click log failed:", insertError.message);
      }
    } catch (logError) {
      console.warn("[affiliate] click log failed:", logError instanceof Error ? logError.message : logError);
    }
  });

  return redirectTo(link.target_url);
}
