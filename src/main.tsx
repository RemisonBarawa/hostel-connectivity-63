
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Setup API proxy to Supabase Edge Function
const apiProxy = async (request: Request) => {
  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/chat')) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      return new Response(JSON.stringify({ error: "Supabase URL not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // Forward request to Supabase Edge Function
    const functionUrl = `${supabaseUrl}/functions/v1/chat`;
    const headers = new Headers(request.headers);
    
    // Add Supabase anonymous key if available
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (supabaseKey) {
      headers.set('apikey', supabaseKey);
    }
    
    // Forward the request
    try {
      const response = await fetch(functionUrl, {
        method: request.method,
        headers,
        body: request.body,
      });
      
      return response;
    } catch (error) {
      console.error("Error calling Supabase Edge Function:", error);
      return new Response(JSON.stringify({ error: "Failed to call chat API" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
  
  // For non-API requests, continue with the normal fetch
  return fetch(request);
};

// Register the fetch interceptor if we're in a browser environment
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = async (input, init) => {
    const request = new Request(input, init);
    const url = new URL(request.url, window.location.origin);
    
    if (url.pathname.startsWith('/api/')) {
      return apiProxy(request);
    }
    
    return originalFetch(input, init);
  };
}

createRoot(document.getElementById("root")!).render(<App />);
