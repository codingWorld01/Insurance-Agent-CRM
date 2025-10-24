'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartData } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface LeadsChartProps {
  data: ChartData[] | null;
  isLoading: boolean;
}



export default function LeadsChart({ data, isLoading }: LeadsChartProps) {
  if (isLoading) {
    return (
      <Card role="status" aria-label="Loading leads chart">
        <CardHeader>
          <CardTitle>Leads by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] sm:h-[300px] bg-gray-200 rounded animate-pulse" aria-hidden="true"></div>
          <span className="sr-only">Loading leads chart...</span>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card role="region" aria-labelledby="leads-chart-title">
        <CardHeader>
          <CardTitle id="leads-chart-title">Leads by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] sm:h-[300px] flex items-center justify-center text-gray-500" role="status">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  // Create accessible data summary
  const totalLeads = data.reduce((sum, item) => sum + item.count, 0);
  const dataDescription = data
    .map(item => `${item.status}: ${item.count} leads`)
    .join(', ');

  return (
    <Card role="region" aria-labelledby="leads-chart-title" aria-describedby="leads-chart-description">
      <CardHeader>
        <CardTitle id="leads-chart-title">Leads by Status</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Screen reader description */}
        <div id="leads-chart-description" className="sr-only">
          Bar chart showing distribution of {totalLeads} total leads by status: {dataDescription}
        </div>
        
        <div className="h-[250px] sm:h-[300px]" role="img" aria-labelledby="leads-chart-title" aria-describedby="leads-chart-description">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={data} 
              margin={{ 
                top: 20, 
                right: 10, 
                left: 10, 
                bottom: 5 
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="status" 
                tick={{ fontSize: 11 }}
                tickLine={false}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={30}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  fontSize: '14px'
                }}
                formatter={(value) => [value, 'Leads']}
                labelFormatter={(label) => `Status: ${label}`}
              />
              <Bar 
                dataKey="count" 
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Accessible data table for screen readers */}
        <table className="sr-only" aria-label="Leads by status data table">
          <caption>Distribution of leads by status</caption>
          <thead>
            <tr>
              <th scope="col">Status</th>
              <th scope="col">Number of Leads</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.status}>
                <td>{item.status}</td>
                <td>{item.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}