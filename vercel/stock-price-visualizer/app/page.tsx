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
  const [stockData, setStockData] = useState<StockPrice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // useEffectの中でSupabaseのデータ取得を行う
    const fetchStockPrices = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("stock_prices")
        .select("*")
        .order("timestamp", { ascending: true });

      if (error) {
        console.error("Error fetching stock prices:", error);
      } else {
        setStockData(data as StockPrice[]);
      }

      setLoading(false);
    };

    fetchStockPrices();
  }, []);

  const chartData = {
    labels: stockData.map((item) =>
      new Date(item.timestamp).toLocaleString()
    ),
    datasets: [
      {
        label: "Stock Price",
        data: stockData.map((item) => item.price),
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const, // 型指定
      },
      title: {
        display: true,
        text: "Stock Price Over Time",
      },
    },
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        Stock Price Visualizer
      </h1>
      {loading ? (
        <p className="text-center">Loading...</p>
      ) : (
        <Line data={chartData} options={options} />
      )}
    </div>
  );
};

export default Home;
