import Groq from 'groq-sdk';

// Initialize Groq SDK
// dangerouslyAllowBrowser is required when calling directly from Vite frontend.
const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY || "dummy_key_to_prevent_crash",
  dangerouslyAllowBrowser: true,
});

const SERPAPI_KEY = import.meta.env.VITE_SERPAPI_API_KEY;

/**
 * Tool execution function for SerpAPI
 * Searches Google and returns organic results as a string
 */
async function searchWeb(query) {
  if (!SERPAPI_KEY) {
    console.warn("SerpAPI key is missing.");
    return "Error: SerpAPI key missing in .env";
  }
  
  const url = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${SERPAPI_KEY}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.organic_results && data.organic_results.length > 0) {
      // Return top 4 results for the model to read
      return data.organic_results
        .slice(0, 4)
        .map(r => `Title: ${r.title}\nSnippet: ${r.snippet}\nLink: ${r.link}`)
        .join('\n\n');
    }
    return "No relevant results found on Google.";
  } catch (error) {
    console.error("SerpAPI search failed:", error);
    return "Search failed due to a network or API error.";
  }
}

/**
 * Generates dynamic recommendations based on user's recent activities using Groq Llama 3
 */
export async function getRecommendations(activities) {
  if (!import.meta.env.VITE_GROQ_API_KEY) {
    return "Welcome! Please set your VITE_GROQ_API_KEY in the .env file to unlock AI insights.";
  }

  if (!activities || activities.length === 0) {
    return "Welcome to EcoTrack AI! 🌱 Start logging your daily activities to get personalized, AI-driven tips on reducing your carbon footprint.";
  }

  const prompt = `Based on these recent activities of the user, provide a very short, encouraging, and specific tip to reduce their carbon footprint (max 2 sentences). Use emojis if appropriate.\nUser Activities: ${JSON.stringify(activities)}`;
  
  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "qwen/qwen3.8-27b",
      temperature: 0.7,
    });
    return completion.choices[0].message.content;
  } catch (e) {
    console.error("Groq recommendation error:", e);
    return "You're doing great! Keep tracking your activities. Consistent tracking is the first step to making lasting, sustainable changes to your lifestyle. 🌟";
  }
}

/**
 * Generates dynamic insights for the simulator using Groq Llama 3
 */
export async function getSimulatorInsight(title, savings, yearlySavings) {
  if (!import.meta.env.VITE_GROQ_API_KEY) {
    return `By ${title.toLowerCase()}, you would save ${savings.toFixed(2)} kg CO₂ per trip.`;
  }
  
  const prompt = `The user is testing a carbon reduction simulator. Action: "${title}". This saves ${savings.toFixed(2)} kg CO2 per trip, which equals ${yearlySavings.toFixed(0)} kg per year. Give a 1-sentence fun, encouraging comparison about this specific saving (e.g. comparing it to planting trees, driving miles, etc).`;
  
  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "qwen/qwen3.8-27b",
      temperature: 0.7,
    });
    return completion.choices[0].message.content;
  } catch (e) {
    const trees = Math.max(0, Math.round(yearlySavings / 21));
    return `By ${title.toLowerCase()}, you would save ${savings.toFixed(2)} kg CO₂ per trip. Over a year, that's equivalent to planting ${trees} trees! 🌳`;
  }
}

/**
 * Agentic Chatbot Engine using Groq (Llama 3.3) + SerpAPI (Tool Calling)
 */
export async function sendChatMessage(message, chatHistory = [], activities = []) {
  if (!import.meta.env.VITE_GROQ_API_KEY) {
    return "⚠️ **API Key Missing:** Please add `VITE_GROQ_API_KEY` to your `.env` file to enable the AI Agent.";
  }

  // 1. Format the conversation history for Groq
  const messages = chatHistory.map(msg => ({
    role: msg.role === 'assistant' ? 'assistant' : 'user',
    content: msg.content
  }));

  // 2. Define the System Prompt
  const systemPrompt = {
    role: "system",
    content: `You are EcoBot, an expert sustainability, environmental science, and carbon-tracking assistant. 
You are an Agentic AI with access to a Google Search tool. 
- ALWAYS use the 'search_web' tool if the user asks for real-time facts, current news, latest policies, prices, or recent data.
- Keep responses concise, friendly, and well-formatted using markdown.
- The user's recent logged activities for context: ${JSON.stringify(activities)}`
  };

  messages.unshift(systemPrompt);

  // 3. Define the Tool for Groq
  const tools = [
    {
      type: "function",
      function: {
        name: "search_web",
        description: "Search Google for real-time information, news, policies, or current facts.",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "The search query to send to Google."
            }
          },
          required: ["query"],
        },
      },
    }
  ];

  try {
    // 4. Initial call to the model
    const response = await groq.chat.completions.create({
      model: "qwen/qwen3.8-27b",
      messages: messages,
      tools: tools,
      tool_choice: "auto",
    });

    const responseMessage = response.choices[0].message;

    // 5. Check if the model wants to call a tool
    if (responseMessage.tool_calls) {
      messages.push(responseMessage);
      
      // Execute each tool call requested
      for (const toolCall of responseMessage.tool_calls) {
        if (toolCall.function.name === "search_web") {
          const args = JSON.parse(toolCall.function.arguments);
          console.log(`🔍 AI triggered web search: "${args.query}"`);
          
          const searchResult = await searchWeb(args.query);
          
          // Feed the tool result back to the model
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            name: toolCall.function.name,
            content: searchResult,
          });
        }
      }

      // 6. Get the final response from the model after it reads the tool output
      const secondResponse = await groq.chat.completions.create({
        model: "qwen/qwen3.8-27b",
        messages: messages,
      });
      
      return secondResponse.choices[0].message.content;
    }

    // 7. If no tool was called, just return the text
    return responseMessage.content;
    
  } catch (error) {
    console.error("Groq Chat Error:", error);
    return "Sorry, I ran into an error processing your request. Please check your console logs or API keys.";
  }
}

/**
 * Scans a raw text receipt or bill using Groq JSON mode
 */
export async function scanReceipt(text) {
  if (!import.meta.env.VITE_GROQ_API_KEY) {
    throw new Error("Missing Groq API Key");
  }

  const prompt = `Extract all sustainability and carbon-related activities from the following raw text (which might be a receipt, electricity bill, or itinerary).
Return ONLY a valid JSON object matching this schema:
{
  "activities": [
    {
      "title": "string (Short description, e.g. 'Electricity Bill' or 'Grocery Shopping')",
      "category": "string (Must be exactly one of: 'transport', 'electricity', 'food', 'shopping')",
      "type": "string (e.g. 'flight', 'kwh', 'beef', 'clothing')",
      "value": "number (The numeric quantity, e.g. amount of kWh, miles flown, or cost)",
      "co2": "number (Estimated CO2 footprint in kg based on standard factors)"
    }
  ],
  "insight": "string (A short, 1-2 sentence actionable insight or observation based specifically on this uploaded content. For example, a tip on how to reduce this specific emission, or a context about how large this footprint is.)"
}

If you cannot find anything, return an empty array for activities and an empty string for insight.

Raw Text:
"""
${text}
"""`;

  try {
    const response = await groq.chat.completions.create({
      model: "qwen/qwen3.8-27b",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result;
  } catch (error) {
    console.error("Groq JSON parsing error:", error);
    return null;
  }
}
