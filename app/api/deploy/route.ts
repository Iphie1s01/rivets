import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { code, projectName } = await req.json();

    const VERCEL_TOKEN = process.env.NEXT_PUBLIC_VERCEL_TOKEN;
    const VERCEL_TEAM_ID = process.env.NEXT_PUBLIC_VERCEL_TEAM_ID; // Optional

    if (!VERCEL_TOKEN) {
      return NextResponse.json(
        {
          error:
            "Vercel API Token missing. Please add VERCEL_TOKEN to your environment variables.",
        },
        { status: 400 },
      );
    }

    // Sanitize project name
    const sanitizedName =
      projectName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .slice(0, 50) || "rivets-project";

    const response = await fetch(
      `https://api.vercel.com/v13/deployments${VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ""}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${VERCEL_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: sanitizedName,
          files: [
            {
              file: "index.html",
              data: code,
            },
          ],
          projectSettings: {
            framework: null,
          },
        }),
      },
    );

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || "Vercel deployment failed");
    }

    return NextResponse.json({
      url: `https://${data.url}`,
      status: data.readyState,
      deploymentId: data.id,
    });
  } catch (error: any) {
    console.error("Deploy Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to deploy to Vercel." },
      { status: 500 },
    );
  }
}
