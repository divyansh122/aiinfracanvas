import { NextRequest, NextResponse } from "next/server";
import {
  invokeBedrock,
  stripMarkdown,
  BedrockTimeoutError,
  BedrockAuthError,
} from "@/lib/bedrock-client";

// Request type
interface RefineRequest {
  currentCode: string;
  userInstruction: string;
}

// Response type
interface RefineResponse {
  code: string;
}

/**
 * Builds a prompt for code refinement
 */
function buildRefinePrompt(currentCode: string, userInstruction: string): string {
  return `Current Terraform Code:
${currentCode}

User Instruction: '${userInstruction}'

Task: Update the code to match the instruction. Output ONLY the raw valid HCL code. No markdown, no explanations, no code fences.`;
}

/**
 * POST handler for refine endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const body: RefineRequest = await request.json();

    // Validate request body
    if (!body.currentCode || typeof body.currentCode !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'currentCode' field" },
        { status: 400 }
      );
    }

    if (!body.userInstruction || typeof body.userInstruction !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'userInstruction' field" },
        { status: 400 }
      );
    }

    // Build prompt and invoke Bedrock
    const prompt = buildRefinePrompt(body.currentCode, body.userInstruction);
    const response = await invokeBedrock(prompt);

    // Strip markdown code fences if present
    const cleanedCode = stripMarkdown(response);

    // Return cleaned HCL code
    const result: RefineResponse = {
      code: cleanedCode,
    };

    return NextResponse.json(result);
  } catch (error) {
    // Handle specific error types
    if (error instanceof BedrockTimeoutError) {
      return NextResponse.json(
        { error: "AI service timeout. Please try again." },
        { status: 504 }
      );
    }

    if (error instanceof BedrockAuthError) {
      return NextResponse.json(
        { error: "Authentication failed. Check AWS credentials." },
        { status: 401 }
      );
    }

    // Generic error
    console.error("AI interaction error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
