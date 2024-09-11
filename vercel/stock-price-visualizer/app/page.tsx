"use client"; // クライアントコンポーネントとして明示する

import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { supabase } from "../lib/supabaseClient";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type StockPrice = {
  symbol: string;
  price: number;
  timestamp: string;
};

const Home = () => {
  const [stockData, setStockData] = useState<Record<string, StockPrice[]>>({});
  const [loading, setLoading] = useState(true);
  const [symbols, setSymbols] = useState<string[]>([]); // シンボルのリスト
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]); // 選択された複数のシンボル
  const [timeRange, setTimeRange] = useState(24); // デフォルトの時間範囲 (24時間)

  // 初期表示時にシンボルリストを取得
  useEffect(() => {
    const fetchSymbols = async () => {
      const { data, error } = await supabase.from("stock_prices").select("symbol");

      if (error) {
        console.error("Error fetching symbols:", error);
      } else {
        const uniqueSymbols = Array.from(new Set(data?.map((item: { symbol: string }) => item.symbol)));
        setSymbols(uniqueSymbols || []);
      }
    };

    fetchSymbols();
  }, []);

  // シンボルや時間範囲の変更時にデータを取得
  useEffect(() => {
    if (selectedSymbols.length > 0) {
      fetchStockPrices();
    }
  }, [selectedSymbols, timeRange]);

  const fetchStockPrices = async () => {
    setLoading(true);
    const stockDataMap: Record<string, StockPrice[]> = {};

    for (const symbol of selectedSymbols) {
      const { data, error } = await supabase
        .from("stock_prices")
        .select("*")
        .eq("symbol", symbol)
        .order("timestamp", { ascending: true });

      if (error) {
        console.error(`Error fetching stock prices for ${symbol}:`, error);
        continue;
      }

      const filteredData = data?.filter((item) => {
        const hoursDifference =
          (new Date().getTime() - new Date(item.timestamp).getTime()) /
          (1000 * 60 * 60);
        return hoursDifference <= timeRange;
      });

      stockDataMap[symbol] = filteredData as StockPrice[];
    }

    setStockData(stockDataMap);
    setLoading(false);
  };

  const chartData = {
    labels: stockData[selectedSymbols[0]]
      ? stockData[selectedSymbols[0]].map((item) =>
          new Date(item.timestamp).toLocaleString()
        )
      : [],
    datasets: selectedSymbols.map((symbol, index) => ({
      label: symbol,
      data: stockData[symbol] ? stockData[symbol].map((item) => item.price) : [],
      borderColor: `hsl(${(index * 60) % 360}, 70%, 50%)`,
      backgroundColor: `hsla(${(index * 60) % 360}, 70%, 50%, 0.2)`,
      tension: 0.1,
    })),
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: `Stock Prices for Selected Symbols (Last ${timeRange} hours)`,
      },
    },
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold text-center mb-8">Stock Price Visualizer</h1>

      <div className="flex justify-center space-x-4 mb-6">
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-900">
            Select Stock Symbols
          </label>
          <select
            className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            value={selectedSymbols}
            onChange={(e) =>
              setSelectedSymbols(
                Array.from(e.target.selectedOptions, (option) => option.value)
              )
            }
            multiple // 複数選択可能
          >
            {symbols.map((symbol) => (
              <option key={symbol} value={symbol}>
                {symbol}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-900">
            Select Time Range (Hours)
          </label>
          <input
            type="number"
            className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            min="1"
            max="72"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-center">Loading...</p>
      ) : (
        <Line data={chartData} options={options} />
      )}
    </div>
  );
};

export default Home;
