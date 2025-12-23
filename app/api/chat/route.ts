import { groq } from "@/lib/groq";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "edge";

const SYSTEM_PROMPT = `
You are ZappyAI, an expert web developer and UI/UX designer.
Your goal is to build and modify websites based on user requests.
You must return your response in a structured JSON format.

Format:
{
  "explanation": "Brief explanation of what you built or changed (plain text).",
  "code": "The full HTML/CSS/JS code for the page. Single file. Use <style> for CSS and <script> for JS."
}

Rules:
1. Always include the FULL code, do not use placeholders like "<!-- rest of code -->".
2. Use modern, beautiful design (Tailwind via CDN or internal CSS).
3. Ensure the code is responsive and interactive.
4. If the user asks for a modification, you must regenerate the full code with the change applied.
5. Do NOT output markdown code blocks. Just the raw JSON.
6. If the user has not explicitly requested the generation or modification of code, do not produce any code. Instead, respond normally to the user's prompt then with a short clarification message asking the user to explicitly request that a website or code be generated or modified. Only generate or modify code after the user makes a clear, direct request.
7. IMAGE SUPPORT: If the user asks for images or if the design needs them, use the following URL format: 
   \`https://image.pollinations.ai/prompt/{description}?width={width}&height={height}&nologo=true\`
   (e.g., \`https://image.pollinations.ai/prompt/coffee%20shop?width=800&height=600&nologo=true\`).
   Replace spaces with \`%20\`.
   This is the BEST source for specific, high-quality images.
   Do NOT use \`unsplash.com\` or local paths.
`;

export async function POST(req: Request) {
  try {
    const { messages, projectId, userId, currentCode } = await req.json();

    // Sanitize messages to only contain allowed fields for LLM
    const sanitizedMessages = messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content
    }));

    // 1. Generate AI Response
    const completion = await groq.chat.completions.create({
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...sanitizedMessages],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 32768,
      response_format: { type: "json_object" },
    });

    const responseContent = completion.choices[0]?.message?.content;

    if (!responseContent) {
      throw new Error("No response from AI");
    }

    const parsed = JSON.parse(responseContent);

    // 2. Persist to Database (if authenticated)
    let finalProjectId = projectId;

    // Check for Authorization header
    const authHeader = req.headers.get("Authorization");

    if (authHeader) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
        {
          global: { headers: { Authorization: authHeader } },
        }
      );

      // A. Create New Project if needed
      if (!finalProjectId) {
        const { data: newProject, error: projError } = await supabase
          .from("projects")
          .insert({
            user_id: userId,
            title: messages[messages.length - 1].content.slice(0, 50) + "...", // Simple title from first prompt
            current_code: parsed.code,
          })
          .select()
          .single();

        if (projError) console.error("Project Create Error:", projError);
        if (newProject) finalProjectId = newProject.id;
      } else {
        // B. Update Existing Project Code
        await supabase
          .from("projects")
          .update({
            current_code: parsed.code,
            updated_at: new Date().toISOString(),
          })
          .eq("id", finalProjectId);
      }

      // C. Save Messages (User + AI)
      // Note: In a real app we'd verify the user owns the project via RLS, which Supabase handles if we used the auth context,
      // but since we are using the Service Key or Client Key here in Edge Runtime, we rely on the passed userId for simple prototypes.
      // Better: Use `supabase.auth.getUser()` with the passed Access Token from headers.
      if (finalProjectId) {
        const userMsg = messages[messages.length - 1]; // The latest user message
        const aiMsg = { role: "assistant", content: parsed.explanation };

        await supabase.from("messages").insert([
          {
            project_id: finalProjectId,
            role: userMsg.role,
            content: userMsg.content,
          },
          {
            project_id: finalProjectId,
            role: aiMsg.role,
            content: aiMsg.content,
          },
        ]);
      }
    }

    return NextResponse.json({ ...parsed, projectId: finalProjectId });
  } catch (error: any) {
    console.error("AI Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate website." },
      { status: 500 }
    );
  }
}
