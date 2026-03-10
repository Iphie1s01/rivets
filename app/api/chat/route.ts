import { groq } from "@/lib/groq";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "edge";

const SYSTEM_PROMPT = `
You are RivetsAI, an expert web developer and UI/UX designer.
Your goal is to build and modify websites based on user requests.
You must return your response in a structured JSON format.

Format:
{
  "explanation": "Brief explanation of what you built or changed (plain text).",
  "code": "The full HTML/CSS/JS code for the page. OR null if using patch.",
  "patch": [
    { "search": "exact string to find", "replace": "string to replace it with" }
  ] // Use this for small modifications to existing code to save tokens.
}

Rules:
1. Always include the FULL code in the "code" field for new projects or major overhauls.
2. For small modifications (e.g., changing colors, adding a small button, fixing text), use the "patch" field instead of "code". Set "code" to null.
3. The "search" string in a patch MUST be an exact, unique match from the existing code (including whitespace).
4. Use modern, beautiful design (Tailwind via CDN or internal CSS).
5. Ensure the code is responsive and interactive.
6. Do NOT output markdown code blocks. Just the raw JSON.
7. IMAGE SUPPORT: Use https://image.pollinations.ai/prompt/{description}?width={width}&height={height}&nologo=true
`;

export async function POST(req: Request) {
  try {
    const { messages, projectId, userId, currentCode } = await req.json();

    // Sanitize messages
    const sanitizedMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));

    // 1. Generate AI Response
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "system", content: `CURRENT CODE:\n${currentCode || "EMPTY"}` },
        ...sanitizedMessages,
      ],
      model: "glm-4-plus",
      temperature: 0.5,
      max_tokens: 32768,
      response_format: { type: "json_object" },
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) throw new Error("No response from AI");

    const parsed = JSON.parse(responseContent);
    let finalCode = parsed.code;

    // 2. Apply Patch if provided
    if (parsed.patch && Array.isArray(parsed.patch) && currentCode) {
      finalCode = currentCode;
      for (const item of parsed.patch) {
        if (item.search && item.replace !== undefined) {
          // Use split/join for simple global replacement of exact matches
          finalCode = finalCode.split(item.search).join(item.replace);
        }
      }
    }

    if (!finalCode) {
      // Fallback or if AI returned nothing
      finalCode = currentCode || "";
    }

    // 3. Persist to Database (if authenticated)
    let finalProjectId = projectId;
    const authHeader = req.headers.get("Authorization");

    if (authHeader) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
        {
          global: { headers: { Authorization: authHeader } },
        },
      );

      if (!finalProjectId) {
        const { data: newProject, error: projError } = await supabase
          .from("projects")
          .insert({
            user_id: userId,
            title: messages[messages.length - 1].content.slice(0, 50) + "...",
            current_code: finalCode,
          })
          .select()
          .single();

        if (projError) console.error("Project Create Error:", projError);
        if (newProject) finalProjectId = newProject.id;
      } else {
        await supabase
          .from("projects")
          .update({
            current_code: finalCode,
            updated_at: new Date().toISOString(),
          })
          .eq("id", finalProjectId);
      }

      if (finalProjectId) {
        const userMsg = messages[messages.length - 1];
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

    return NextResponse.json({
      ...parsed,
      code: finalCode,
      projectId: finalProjectId,
    });
  } catch (error: any) {
    console.error("AI Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate website." },
      { status: 500 },
    );
  }
}
