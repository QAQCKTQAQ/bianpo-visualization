// src/component/Chart.jsx
import React, { useEffect, useRef } from 'react';
import { Chart } from '@antv/g2';

const MyChart = ({ data }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    const chart = new Chart({
      container: chartRef.current,
      autoFit: true,
      height: 500,
    });

    chart.data(data);
    chart.scale({
        timestamp: {
          type: 'time',
          alias: '时间',
          mask: 'YYYY-MM-DD HH:mm:ss', // 确保显示格式
        },
        batteryPercent: {
          min: 0,
          max: 100, // 假设电量百分比范围为 0-100
          alias: '电量',
        },
    });
    
    chart.line().position('timestamp*batteryPercent').shape('smooth');
    chart.point().position('timestamp*batteryPercent').shape('circle');
    chart.tooltip({
      showCrosshairs: true,
      shared: true,
    });

    chart.tooltip({
        showCrosshairs: true,

        shared: true,
        
        formatter: (item) => {
          return {
            name: '时间',
            value: item.timestamp, // 直接使用传入的时间戳
          };
        },
    });
    
    chart.render();

    return () => {
      chart.destroy(); // 清理
    };
  }, [data]);

  return <div ref={chartRef} />;
};

export default MyChart;
