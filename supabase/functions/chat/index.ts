
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// System prompt for the HostelHelper
const SYSTEM_PROMPT = `You are a virtual assistant named "HostelHelper" for a hostel management system website tailored specifically for Kirinyaga University students and hostel owners in Kenya. Your primary role is to provide friendly, concise, accurate, and action-oriented responses to inquiries about finding affordable hostels, listing properties, and navigating the platform. Your responses should align with the website's mission to connect students with safe, budget-friendly accommodation near Kirinyaga University and enable hostel owners to reach prospective student tenants efficiently.

## Core Guidelines
- **Tone and Style**: Maintain a professional yet approachable tone, suitable for young university students (aged 18–25) and local hostel owners. Use simple, clear language, avoiding technical jargon unless necessary. Responses should feel warm, encouraging, and supportive, reflecting the local Kenyan context (e.g., terms like "hostels," "campus," or "amenities").
- **Action-Oriented**: Always include a clear next step or call-to-action, such as browsing listings, listing a property, or contacting support. Use website links to direct users to relevant pages.
- **Conciseness**: Keep responses brief (ideally under 100 words) while addressing the user's query fully. Avoid unnecessary details but ensure clarity and completeness.
- **Local Relevance**: Incorporate context specific to Kirinyaga University, such as proximity to campus, common student needs (e.g., affordable pricing, Wi-Fi, security), and the local rental market.

## Website URLs to reference:
- Hostel Search: /hostel-search
- Property Listing: /hostel-create
`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY is not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const requestData = await req.json();
    const { message, history } = requestData;

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Missing message parameter" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log("Received message:", message);
    console.log("Chat history length:", history ? history.length : 0);

    // Prepare conversation history for Gemini
    const messages = [];
    
    // Add system prompt
    messages.push({
      role: "model",
      parts: [{ text: SYSTEM_PROMPT }]
    });
    
    // Add conversation history
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        if (msg && msg.role && msg.content) {
          messages.push({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.content }]
          });
        }
      }
    }
    
    // Add the new user message
    messages.push({
      role: "user",
      parts: [{ text: message }]
    });

    console.log("Calling Gemini API with messages:", JSON.stringify(messages).substring(0, 500) + "...");

    // Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: messages,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 800,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API HTTP error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: `Gemini API error: ${response.status} - ${errorText}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const data = await response.json();
    console.log("Gemini API response status:", !!data.candidates);

    if (!data.candidates || data.candidates.length === 0) {
      console.error("No response from Gemini API:", JSON.stringify(data));
      
      // Check if there's an error message in the response
      if (data.error) {
        return new Response(
          JSON.stringify({ error: `Error from Gemini API: ${data.error.message || JSON.stringify(data.error)}` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to get response from assistant" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Extract the response from the Gemini API
    if (!data.candidates[0].content || 
        !data.candidates[0].content.parts || 
        data.candidates[0].content.parts.length === 0) {
      console.error("Invalid response format from Gemini API");
      return new Response(
        JSON.stringify({ error: "Invalid response format from assistant" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const assistantResponse = data.candidates[0].content.parts[0].text;
    console.log("Assistant response:", assistantResponse.substring(0, 100) + "...");

    return new Response(
      JSON.stringify({ response: assistantResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in chat function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unknown error occurred" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
