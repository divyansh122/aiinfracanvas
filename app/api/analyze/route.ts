import { NextRequest, NextResponse } from "next/server";
import {
  invokeBedrockWithJSON,
  BedrockTimeoutError,
  BedrockAuthError,
  JSONParseError,
} from "@/lib/bedrock-client";

// Request types
interface NodeData {
  id: string;
  type: string;
  data: Record<string, any>;
}

type AnalyzeRequest =
  | { type: "node"; nodeData: NodeData }
  | { type: "connection"; source: NodeData; target: NodeData };

// Response types
interface NodeAnalysisResponse {
  analysis: string;
  suggestions: string[];
  cost_est: string;
}

interface ConnectionAnalysisResponse {
  message: string;
  terraform_snippet: string;
}

/**
 * Builds a prompt for node analysis
 */
function buildNodeAnalysisPrompt(nodeData: NodeData): string {
  return `You are a Senior Cloud Architect. Analyze this AWS resource: ${JSON.stringify(nodeData)}.
  
Return a JSON object with exactly these fields:
- "analysis": A single sentence summary of this resource
- "suggestions": An array of exactly 3 short critical tips for security or cost optimization
- "cost_est": A string estimate like "$18/mo" or "$0.10/request"

Output ONLY valid JSON, no markdown.`;
}

/**
 * Builds a prompt for connection analysis
 */
function buildConnectionPrompt(source: NodeData, target: NodeData): string {
  return `User connected ${source.type} to ${target.type}.
  
Return a JSON object with exactly these fields:
- "message": A short explanation of this connection (1-2 sentences)
- "terraform_snippet": Valid HCL code for security group rule or IAM policy to enable this connection

Output ONLY valid JSON, no markdown.`;
}

/**
 * Validates node analysis response structure
 */
function validateNodeAnalysis(response: any): NodeAnalysisResponse {
  if (!response.analysis || typeof response.analysis !== "string") {
    throw new JSONParseError("Missing or invalid 'analysis' field");
  }

  if (!Array.isArray(response.suggestions) || response.suggestions.length !== 3) {
    throw new JSONParseError("'suggestions' must be an array of exactly 3 strings");
  }

  if (!response.cost_est || typeof response.cost_est !== "string") {
    throw new JSONParseError("Missing or invalid 'cost_est' field");
  }

  return {
    analysis: response.analysis,
    suggestions: response.suggestions,
    cost_est: response.cost_est,
  };
}

/**
 * Validates connection analysis response structure
 */
function validateConnectionAnalysis(response: any): ConnectionAnalysisResponse {
  if (!response.message || typeof response.message !== "string") {
    throw new JSONParseError("Missing or invalid 'message' field");
  }

  if (!response.terraform_snippet || typeof response.terraform_snippet !== "string") {
    throw new JSONParseError("Missing or invalid 'terraform_snippet' field");
  }

  return {
    message: response.message,
    terraform_snippet: response.terraform_snippet,
  };
}

/**
 * POST handler for analyze endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();

    // Handle node analysis
    if (body.type === "node") {
      const prompt = buildNodeAnalysisPrompt(body.nodeData);
      const response = await invokeBedrockWithJSON(prompt);
      const validatedResponse = validateNodeAnalysis(response);
      return NextResponse.json(validatedResponse);
    }

    // Handle connection analysis
    if (body.type === "connection") {
      const prompt = buildConnectionPrompt(body.source, body.target);
      const response = await invokeBedrockWithJSON(prompt);
      const validatedResponse = validateConnectionAnalysis(response);
      return NextResponse.json(validatedResponse);
    }

    // Invalid request type
    return NextResponse.json(
      { error: "Invalid request type. Must be 'node' or 'connection'." },
      { status: 400 }
    );
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

    if (error instanceof JSONParseError) {
      return NextResponse.json(
        { error: `AI returned invalid response: ${error.message}` },
        { status: 500 }
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
