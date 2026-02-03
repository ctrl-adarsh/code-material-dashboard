import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Helper: Fetch metadata from any URL
async function fetchMetadata(url: string) {
  // 1. Try NoEmbed (Best for YouTube/Vimeo)
  try {
    const noembed = await fetch(`https://noembed.com/embed?url=${url}`).then(
      (r) => r.json()
    );
    if (noembed.title)
      return {
        title: noembed.title,
        thumbnail: noembed.thumbnail_url,
        type: "video",
      };
  } catch (e) {
    /* Continue to fallback */
  }

  // 2. Fallback: Scrape HTML Title (Best for Blogs/Articles)
  try {
    console.log("NoEmbed failed, scraping HTML title...");
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Bot)" }, // Pretend to be a browser
    });
    const html = await res.text();

    // Extract <title> using Regex
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : url;

    return { title: title, thumbnail: null, type: "article" };
  } catch (e) {
    return { title: url, thumbnail: null, type: "link" }; // Worst case: just save the URL
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  try {
    const { url, user_id } = await req.json();
    if (!url) throw new Error("URL is missing");

    // Initialize
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    const genAI = new GoogleGenerativeAI(Deno.env.get("GEMINI_API_KEY") ?? "");

    // 1. Get Metadata
    const meta = await fetchMetadata(url);
    console.log("Metadata found:", meta);

    // 2. Ask Gemini to Classify
    // Using 'gemini-pro' because it is most stable for text analysis
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      Analyze this coding resource: "${meta.title}".
      Resource Type hint: ${meta.type}.
      
      Return ONLY a raw JSON object (no markdown) with this schema:
      {
        "topic": "String | Array | System Design | React | CSS | General",
        "difficulty": "Easy | Medium | Hard",
        "summary": "10-word summary",
        "tags": ["tag1", "tag2"],
        "content_type": "Video | Article | Documentation | Course"
      }
    `;
    const aiResult = await model.generateContent(prompt);
    const text = aiResult.response.text();
    const cleanJson = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const analysis = JSON.parse(cleanJson);

    // 3. Insert into Database
    const { error } = await supabase.from("completed_videos").insert({
      user_id: user_id,
      url: url,
      title: meta.title,
      thumbnail: meta.thumbnail,
      status: "completed",
      ...analysis, // Spreads topic, difficulty, summary, tags, content_type
    });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
