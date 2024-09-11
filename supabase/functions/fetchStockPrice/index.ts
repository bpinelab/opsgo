import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js";

// Main request handler function
export async function handleRequest(req: Request): Promise<Response> {
  // Fetch environment variables
  const supabaseUrl = Deno.env.get("PROJECT_SUPABASE_URL") || "";
  const supabaseKey = Deno.env.get("PROJECT_SUPABASE_KEY") || "";
  const apiKey = Deno.env.get("ALPHA_VANTAGE_API_KEY") || "";

  // Validate environment variables
  if (!supabaseUrl || !supabaseKey || !apiKey) {
    console.error("Missing environment variables");
    return new Response("Server configuration error", { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response("Invalid request method", { status: 405 });
  }

  try {
    // Parse request body
    const { symbol } = await req.json();

    // Validate symbol
    if (!symbol) {
      return new Response("Stock symbol is required", { status: 400 });
    }

    // Fetch stock price data from Alpha Vantage API
    const apiUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=60min&apikey=${apiKey}`;
    const response = await fetch(apiUrl);
    const stockData = await response.json();

    const timeSeries = stockData["Time Series (60min)"];
    if (!timeSeries) {
      console.error("Invalid data from Alpha Vantage", stockData);
      return new Response("Error fetching stock price data", { status: 500 });
    }

    // Insert stock prices into Supabase
    for (const [timestamp, values] of Object.entries(
      timeSeries as Record<string, any>
    )) {
      const price = parseFloat(values["4. close"]);
      const formattedTimestamp = new Date(timestamp).toISOString();

      // Check if data already exists
      const { data: existingData, error: checkError } = await supabase
        .from("stock_prices")
        .select("id")
        .eq("symbol", symbol)
        .eq("timestamp", formattedTimestamp);

      if (checkError) {
        console.error("Error checking existing data", checkError);
        continue;
      }

      // Insert only if the data does not exist
      if (!existingData || existingData.length === 0) {
        const { error: insertError } = await supabase
          .from("stock_prices")
          .insert([{ symbol, price, timestamp: formattedTimestamp }]);

        if (insertError) {
          console.error(
            `Error inserting data for ${formattedTimestamp}`,
            insertError
          );
          return new Response(
            `Error inserting data for ${formattedTimestamp}`,
            { status: 500 }
          );
        }
      }
    }

    return new Response(`Stock prices for ${symbol} updated successfully`, {
      status: 200,
    });
  } catch (error) {
    console.error("Error processing request", error);
    return new Response("Error processing request", { status: 500 });
  }
}

// Only run Deno.serve if the script is executed directly (not during testing)
if (import.meta.main) {
  Deno.serve(handleRequest);
}
