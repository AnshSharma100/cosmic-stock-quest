import { LineChart, Line, ResponsiveContainer } from "recharts";

const generateMockData = () => {
  return Array.from({ length: 30 }, (_, i) => ({
    value: Math.random() * 100 + 100 + i * 2,
  }));
};

export const StockChart = () => {
  const data = generateMockData();
  
  return (
    <ResponsiveContainer width="100%" height={120}>
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="value"
          stroke="hsl(263 70% 60%)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
