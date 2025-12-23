import Groq from "groq-sdk";

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY,
  dangerouslyAllowBrowser: true // Note: Ideally, keep this server-side only in /api routes, but enabling for quick prototyping if client-side calls are needed (though we'll aim for API routes).
});
