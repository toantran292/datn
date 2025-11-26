import { Card } from "./ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const costData = [
  {
    month: "Jun",
    "Marketing Campaign 2025": 780,
    "Product Development": 1250,
    "Customer Success Hub": 450,
    total: 2480
  },
  {
    month: "Jul",
    "Marketing Campaign 2025": 820,
    "Product Development": 1320,
    "Customer Success Hub": 480,
    total: 2620
  },
  {
    month: "Aug",
    "Marketing Campaign 2025": 850,
    "Product Development": 1380,
    "Customer Success Hub": 490,
    total: 2720
  },
  {
    month: "Sep",
    "Marketing Campaign 2025": 870,
    "Product Development": 1400,
    "Customer Success Hub": 510,
    total: 2780
  },
  {
    month: "Oct",
    "Marketing Campaign 2025": 892,
    "Product Development": 1435,
    "Customer Success Hub": 520,
    total: 2847
  }
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-xl shadow-lg border border-border">
        <p className="mb-2" style={{ fontWeight: 600 }}>{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}:</span>
            </div>
            <span style={{ fontWeight: 600 }}>${entry.value.toFixed(2)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function CostTrendChart() {
  return (
    <Card className="p-6 shadow-md rounded-2xl border border-border">
      <div className="mb-6">
        <h3 style={{ fontWeight: 600 }}>Cost Trend & Forecast</h3>
        <p className="text-muted-foreground text-sm mt-1">
          Historical usage costs by project over the last 5 months
        </p>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={costData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="month" 
            stroke="#6B7280"
            style={{ fontSize: '0.875rem' }}
          />
          <YAxis 
            stroke="#6B7280"
            style={{ fontSize: '0.875rem' }}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />
          <Line 
            type="monotone" 
            dataKey="Marketing Campaign 2025" 
            stroke="#F59E0B" 
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="Product Development" 
            stroke="#00C4AB" 
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="Customer Success Hub" 
            stroke="#8B5CF6" 
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="total" 
            stroke="#FF8800" 
            strokeWidth={3}
            dot={{ r: 5 }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
