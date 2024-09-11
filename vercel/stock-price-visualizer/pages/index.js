import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { supabase } from '../lib/supabaseClient';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function Home() {
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStockPrices();
  }, []);

  // Supabaseからデータを取得
  const fetchStockPrices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('stock_prices')
      .select('*')
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Error fetching stock prices:', error);
    } else {
      setStockData(data);
    }

    setLoading(false);
  };

  // グラフ用のデータ変換
  const chartData = {
    labels: stockData.map((item) => new Date(item.timestamp).toLocaleString()), // タイムスタンプをラベルに変換
    datasets: [
      {
        label: 'Stock Price',
        data: stockData.map((item) => item.price), // 株価データ
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Stock Price Over Time',
      },
    },
  };

  return (
    <div>
      <h1>Stock Price Visualizer</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <Line data={chartData} options={options} />
      )}
    </div>
  );
}
