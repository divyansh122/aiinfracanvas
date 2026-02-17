import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

// Custom error classes
export class BedrockTimeoutError extends Error {
  constructor(message: string = "Bedrock request timed out") {
    super(message);
    this.name = "BedrockTimeoutError";
  }
}

export class BedrockAuthError extends Error {
  constructor(message: string = "Bedrock authentication failed") {
    super(message);
    this.name = "BedrockAuthError";
  }
}

export class JSONParseError extends Error {
  constructor(message: string = "Failed to parse JSON response") {
    super(message);
    this.name = "JSONParseError";
  }
}

// Bedrock client configuration
const bedrockConfig = {
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
};

const BEDROCK_MODEL = "nvidia.nemotron-nano-12b-v2";
const TIMEOUT_MS = 30000; // 30 seconds

/**
 * Invokes AWS Bedrock with a prompt and returns parsed JSON response
 * @param prompt - The prompt to send to Bedrock
 * @returns Parsed JSON object from Bedrock response
 * @throws BedrockTimeoutError if request times out
 * @throws BedrockAuthError if authentication fails
 * @throws JSONParseError if response is not valid JSON
 */
export async function invokeBedrockWithJSON(prompt: string): Promise<any> {
  const responseText = await invokeBedrock(prompt);
  
  try {
    return JSON.parse(responseText);
  } catch (error) {
    throw new JSONParseError(`Bedrock returned invalid JSON: ${responseText.substring(0, 100)}...`);
  }
}

/**
 * Invokes AWS Bedrock with a prompt and returns raw text response
 * @param prompt - The prompt to send to Bedrock
 * @returns Raw text response from Bedrock
 * @throws BedrockTimeoutError if request times out
 * @throws BedrockAuthError if authentication fails
 */
export async function invokeBedrock(prompt: string): Promise<string> {
  // Check credentials
  if (!bedrockConfig.credentials.accessKeyId || !bedrockConfig.credentials.secretAccessKey) {
    throw new BedrockAuthError("AWS credentials are missing. Check AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.");
  }

  const client = new BedrockRuntimeClient(bedrockConfig);

  const command = new InvokeModelCommand({
    modelId: BEDROCK_MODEL,
    body: JSON.stringify({
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      top_p: 0.9,
    }),
  });

  try {
    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new BedrockTimeoutError()), TIMEOUT_MS);
    });

    // Race between actual request and timeout
    const response = await Promise.race([
      client.send(command),
      timeoutPromise,
    ]);

    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    // Handle NVIDIA Nemotron response format
    if (responseBody.choices && responseBody.choices[0]?.message?.content) {
      return responseBody.choices[0].message.content;
    }
    
    // Fallback to content array format (Claude-style)
    if (responseBody.content && responseBody.content[0]?.text) {
      return responseBody.content[0].text;
    }
    
    throw new Error("Unexpected response format from Bedrock");
  } catch (error: any) {
    // Handle specific error types
    if (error instanceof BedrockTimeoutError) {
      throw error;
    }

    if (error.name === "UnrecognizedClientException" || 
        error.name === "InvalidSignatureException" ||
        error.name === "AccessDeniedException" ||
        error.name === "ResourceNotFoundException") {
      throw new BedrockAuthError(`Authentication or model access failed: ${error.message}`);
    }

    // Re-throw other errors
    throw error;
  }
}

/**
 * Strips markdown code fences from text
 * Removes ```hcl, ```terraform, or ``` markers
 * @param text - Text potentially containing markdown code fences
 * @returns Clean text without code fences
 */
export function stripMarkdown(text: string): string {
  return text
    .replace(/```(?:hcl|terraform)?\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
}
