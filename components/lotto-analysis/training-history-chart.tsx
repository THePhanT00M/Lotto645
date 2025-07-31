"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

interface TrainingHistory {
  epoch: number
  loss: number
}

const getTrainingHistory = async (): Promise<TrainingHistory[]> => {
  // Replace with your actual API endpoint
  const apiUrl = "/api/training-history"

  try {
    const response = await fetch(apiUrl)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error("Failed to fetch training history:", error)
    return []
  }
}

const TrainingHistoryChart: React.FC = () => {
  const [trainingHistory, setTrainingHistory] = useState<TrainingHistory[]>([])

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await getTrainingHistory()
        if (history) {
          setTrainingHistory(history)
        }
      } catch (error) {
        console.error("학습 히스토리 로드 실패:", error)
      }
    }

    loadHistory()
  }, [])

  const chartData = {
    labels: trainingHistory.map((item) => item.epoch.toString()),
    datasets: [
      {
        label: "Loss",
        data: trainingHistory.map((item) => item.loss),
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Training History",
      },
    },
  }

  return <Line options={options} data={chartData} />
}

export default TrainingHistoryChart
