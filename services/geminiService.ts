
import { GoogleGenAI, Type } from "@google/genai";
import { MovementPoint, VerificationResult, CaptchaMode, CaptchaDifficulty } from "../types";

// Always use the named parameter and process.env.API_KEY directly
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODELS = [
  "gemini-2.0-flash-exp",
  "gemini-2.5-flash", 
  "gemini-2.0-flash",
  "gemini-2.0-flash-001"
];

export async function verifyHumanity(movements: MovementPoint[], mode: CaptchaMode, difficulty: CaptchaDifficulty): Promise<VerificationResult> {
  // Use adaptive sampling: preserve details where velocity changes rapidly
  const simplifiedMovements = movements.filter((p, i) => {
    if (i === 0 || i === movements.length - 1) return true;
    const prev = movements[i-1];
    const dist = Math.sqrt(Math.pow(p.x - prev.x, 2) + Math.pow(p.y - prev.y, 2));
    return dist > 5 || i % 8 === 0;
  }).map(p => ({ x: Math.round(p.x), y: Math.round(p.y), t: Math.round(p.t), type: p.type }));

  const prompt = `
    Analyze this web behavioral sequence for "Proof-of-Human" verification.
    
    Context:
    - Task Type: ${mode.toUpperCase()}
    - Difficulty Level: ${difficulty.toUpperCase()}
    
    Sequence Data: ${JSON.stringify(simplifiedMovements)}

    STRICT SECURITY EVALUATION CRITERIA (RELAXED FOR REAL-WORLD USAGE):
    1. PATH COMPLEXITY: 
       - If Task is TRACE: Compare the user's path to the expected curve. 
       - ALLOW for significant deviation (human imperfection).
       - ACCEPT 70-80% match efficiency. Humans are not plotters.
       - REJECT only if it is a perfect straight line (machine) or completely unrelated to the target.
    
    2. MICRO-VARIANCE: 
       - Humans have "biological noise" (jitter).
       - Too perfect = BOT.
       - Too chaotic = Human or bad mouse. GIVE BENEFIT OF DOUBT to human.

    3. ACCELERATION: 
       - Natural acceleration/deceleration is expected but don't fail just because of steady hand.
       - Fail only on INSTANT teleportation or mathematically perfect constant speed over long distance.

    4. CONTEXTUAL RELEVANCE: 
       - Did they generally attempt the task?
       - For TRACE: Did they start near start and end near end?
       - For SLIDER: Did they reach the target?

    VERDICT RULES:
    - If path looks vaguely like the target curve -> isHuman: true.
    - If deviation is high but start/end points are correct -> isHuman: true.
    - If velocity is "somewhat" constant but has noise -> isHuman: true.
    - Only reject obvious scripts (0 variance, 100% linearity, instant jumps).

    Provide a detailed security verdict. Be lenient with humans.
  `;

  let lastError: any;

  for (const model of MODELS) {
    try {
      console.log(`Attempting verification with model: ${model}`);
      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isHuman: { type: Type.BOOLEAN },
              confidence: { type: Type.NUMBER, description: "0.0 to 1.0 confidence score" },
              reasoning: { type: Type.STRING, description: "Short explanation of the verdict" }
            },
            required: ["isHuman", "confidence", "reasoning"]
          }
        }
      });

      // Access .text property directly (not a method)
      const result = JSON.parse(response.text || '{}');
      return {
        isHuman: result.isHuman ?? false,
        confidence: result.confidence ?? 0,
        reasoning: result.reasoning ?? "Analysis failed."
      };
    } catch (error: any) {
      console.warn(`Model ${model} failed:`, error.message);
      lastError = error;
      // If it's a 429 (Quota) or 404 (Not Found), continue to next model
      // Otherwise might want to stop, but for now let's try all
      if (error.message?.includes("429") || error.message?.includes("404")) {
         continue;
      }
    }
  }

  // If all models fail
  console.error("All Gemini models failed. Last error:", lastError);
  return {
    isHuman: false,
    confidence: 0,
    reasoning: `Verification failed on all models. Last error: ${lastError?.message || "Unknown error"}. Please check your API key and quota.`
  };
}
