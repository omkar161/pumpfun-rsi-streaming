"use client";

import React, { useEffect, useState } from "react";
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
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type PricePoint = { time: string; price: number };
type RsiPoint = { time: string; rsi: number };

export default function Dashboard() {
  const [selectedToken, setSelectedToken] = useState("TOKEN1");
  const [priceData, setPriceData] = useState<PricePoint[]>([]);
  const [rsiData, setRsiData] = useState<RsiPoint[]>([]);

  useEffect(() => {
    const prices: PricePoint[] = Array.from({ length: 20 }).map((_, i) => ({
      time: `T${i}`,
      price: 100 + Math.random() * 20,
    }));

    const rsi: RsiPoint[] = Array.from({ length: 20 }).map((_, i) => ({
      time: `T${i}`,
      rsi: 30 + Math.random() * 40,
    }));

    setPriceData(prices);
    setRsiData(rsi);
  }, [selectedToken]);

  const priceChart = {
    labels: priceData.map((d) => d.time),
    datasets: [
      {
        label: `Price (${selectedToken})`,
        data: priceData.map((d) => d.price),
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59,130,246,0.2)",
        tension: 0.3,
      },
    ],
  };

  const rsiChart = {
    labels: rsiData.map((d) => d.time),
    datasets: [
      {
        label: `RSI (${selectedToken})`,
        data: rsiData.map((d) => d.rsi),
        borderColor: "#ef4444",
        backgroundColor: "rgba(239,68,68,0.2)",
        tension: 0.3,
      },
      {
        label: "Overbought (70)",
        data: rsiData.map(() => 70),
        borderColor: "rgba(234,179,8,0.8)",
        borderDash: [5, 5],
        pointRadius: 0,
      },
      {
        label: "Oversold (30)",
        data: rsiData.map(() => 30),
        borderColor: "rgba(59,130,246,0.8)",
        borderDash: [5, 5],
        pointRadius: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
      title: { display: false },
    },
  };

  const tokenStats = {
    price: priceData.length
      ? priceData[priceData.length - 1].price.toFixed(2)
      : "--",
    rsi: rsiData.length
      ? rsiData[rsiData.length - 1].rsi.toFixed(2)
      : "--",
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      {/* Header */}
      <header className="flex items-center px-8 py-6 bg-white shadow-lg border-b border-gray-200">
        <div className="ml-2">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-pink-500 to-yellow-500 text-transparent bg-clip-text">
            PumpFun RSI Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Live price & RSI insights for trending tokens
          </p>
        </div>
        <script src="https://cdn.tailwindcss.com"></script>

      </header>

      <main className="max-w-5xl mx-auto space-y-10 p-6">
        {/* Token Selector Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col md:flex-row items-center justify-between border border-gray-200">
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-2">
              Select Token
            </label>
            <select
              value={selectedToken}
              onChange={(e) => setSelectedToken(e.target.value)}
              className="p-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-800 font-medium focus:border-indigo-400 focus:ring-2 focus:ring-indigo-300"
            >
              <option value="TOKEN1">TOKEN1</option>
              <option value="TOKEN2">TOKEN2</option>
              <option value="TOKEN3">TOKEN3</option>
              <option value="TOKEN4">TOKEN4</option>
              <option value="TOKEN5">TOKEN5</option>
            </select>
          </div>
          <div className="mt-6 md:mt-0 flex space-x-10">
            <div className="text-center bg-indigo-50 px-4 py-2 rounded-lg shadow">
              <div className="text-xs text-gray-500">Current Price</div>
              <div className="text-2xl font-bold text-indigo-600">
                ${tokenStats.price}
              </div>
            </div>
            <div className="text-center bg-pink-50 px-4 py-2 rounded-lg shadow">
              <div className="text-xs text-gray-500">Current RSI</div>
              <div className="text-2xl font-bold text-pink-600">
                {tokenStats.rsi}
              </div>
            </div>
          </div>
        </div>

        {/* Price Chart */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-indigo-600">
            📈 Price Chart
          </h2>
          <Line data={priceChart} options={options} />
        </div>

        {/* RSI Chart */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-pink-600">
            🔥 RSI Chart
          </h2>
          <Line data={rsiChart} options={options} />
        </div>
      </main>

      <footer className="mt-14 text-center text-gray-500 text-sm pb-8">
        © 2025 PumpFun RSI Dashboard | Built with{" "}
        <span className="text-indigo-600 font-semibold">Next.js</span> &{" "}
        <span className="text-pink-600 font-semibold">Chart.js</span>
      </footer>
    </div>
  );
}
