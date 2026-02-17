import { NextRequest, NextResponse } from "next/server";
import {
  invokeBedrockWithJSON,
  BedrockTimeoutError,
  BedrockAuthError,
  JSONParseError,
} from "@/lib/bedrock-client";

// Request types
interface SimulateRequest {
  nodes: Array<{ id: string; type: string; data: any }>;
  edges: Array<{ source: string; target: string }>;
}

// Response types
interface SecurityIntercept {
  detected: boolean;
  message: string;
  fix_action: string;
}

interface SimulateResponse {
  steps: string[];
  security_intercept: SecurityIntercept;
}

// Fallback simulation data for Bedrock failures
const FALLBACK_SIMULATION: SimulateResponse = {
  steps: [
    "Initializing Terraform...",
    "Configuring AWS provider...",
    "Planning infrastructure changes...",
    "Creating resources...",
    "Applying configuration...",
    "Deployment complete!",
  ],
  security_intercept: {
    detected: false,
    message: "No issues detected",
    fix_action: "N/A",
  },
};

/**
 * Detects if the infrastructure graph contains security risks
 * Returns true if S3 or EC2 nodes are present
 */
function detectSecurityRisk(nodes: Array<{ type: string }>): boolean {
  return nodes.some((n) => n.type === "s3" || n.type === "ec2");
}

/**
 * Builds a prompt for deployment simulation
 */
function buildSimulationPrompt(
  nodes: any[],
  edges: any[],
  hasRisk: boolean
): string {
  return `Act as a deployment engine. Analyze this infrastructure graph:
Nodes: ${JSON.stringify(nodes)}
Edges: ${JSON.stringify(edges)}

Return a JSON object with exactly these fields:
- "steps": An array of 6-8 realistic Terraform deployment log strings (e.g., "Initializing provider...", "Creating aws_instance.web...")
- "security_intercept": An object with:
  - "detected": ${hasRisk} (boolean)
  - "message": ${hasRisk ? 'A realistic security warning about S3 public access or EC2 security groups' : '"No issues detected"'}
  - "fix_action": ${hasRisk ? 'Description of the fix to apply' : '"N/A"'}

Output ONLY valid JSON, no markdown.`;
}

/**
 * Validates simulation response structure
 * Requirements: 4.3, 4.5, 4.6
 */
function validateSimulation(
  response: any,
  expectedSecurityRisk: boolean
): SimulateResponse {
  // Validate steps array has 6-8 entries
  if (!Array.isArray(response.steps)) {
    throw new JSONParseError("Missing or invalid 'steps' field - must be an array");
  }

  if (response.steps.length < 6 || response.steps.length > 8) {
    throw new JSONParseError(
      `'steps' array must have 6-8 entries, got ${response.steps.length}`
    );
  }

  // Validate security_intercept has required fields
  if (!response.security_intercept || typeof response.security_intercept !== "object") {
    throw new JSONParseError("Missing or invalid 'security_intercept' field");
  }

  const intercept = response.security_intercept;

  if (typeof intercept.detected !== "boolean") {
    throw new JSONParseError("'security_intercept.detected' must be a boolean");
  }

  if (!intercept.message || typeof intercept.message !== "string") {
    throw new JSONParseError("Missing or invalid 'security_intercept.message' field");
  }

  if (!intercept.fix_action || typeof intercept.fix_action !== "string") {
    throw new JSONParseError("Missing or invalid 'security_intercept.fix_action' field");
  }

  // Ensure detected boolean matches S3/EC2 presence
  if (intercept.detected !== expectedSecurityRisk) {
    throw new JSONParseError(
      `'security_intercept.detected' (${intercept.detected}) does not match expected security risk (${expectedSecurityRisk})`
    );
  }

  return {
    steps: response.steps,
    security_intercept: {
      detected: intercept.detected,
      message: intercept.message,
      fix_action: intercept.fix_action,
    },
  };
}

/**
 * POST handler for simulate endpoint
 * Requirements: 4.1, 4.2, 4.4, 4.7
 */
export async function POST(request: NextRequest) {
  try {
    const body: SimulateRequest = await request.json();

    // Validate request body
    if (!body.nodes || !Array.isArray(body.nodes)) {
      return NextResponse.json(
        { error: "Invalid request: 'nodes' must be an array" },
        { status: 400 }
      );
    }

    if (!body.edges || !Array.isArray(body.edges)) {
      return NextResponse.json(
        { error: "Invalid request: 'edges' must be an array" },
        { status: 400 }
      );
    }

    // Detect security risks
    const hasSecurityRisk = detectSecurityRisk(body.nodes);

    // Build prompt and invoke Bedrock
    const prompt = buildSimulationPrompt(body.nodes, body.edges, hasSecurityRisk);
    
    try {
      const response = await invokeBedrockWithJSON(prompt);
      const validatedResponse = validateSimulation(response, hasSecurityRisk);
      return NextResponse.json(validatedResponse);
    } catch (bedrockError) {
      // If Bedrock fails, return fallback simulation data
      if (
        bedrockError instanceof BedrockTimeoutError ||
        bedrockError instanceof BedrockAuthError ||
        bedrockError instanceof JSONParseError
      ) {
        console.warn("Bedrock failed, using fallback simulation:", bedrockError);
        
        // Adjust fallback based on detected security risk
        const fallbackWithRisk: SimulateResponse = {
          ...FALLBACK_SIMULATION,
          security_intercept: hasSecurityRisk
            ? {
                detected: true,
                message: "⚠️ Security Warning: Potential public access detected on S3 or EC2 resources",
                fix_action: "Apply security group restrictions and enable encryption",
              }
            : FALLBACK_SIMULATION.security_intercept,
        };
        
        return NextResponse.json(fallbackWithRisk);
      }
      
      // Re-throw unexpected errors
      throw bedrockError;
    }
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
    console.error("Simulation error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
