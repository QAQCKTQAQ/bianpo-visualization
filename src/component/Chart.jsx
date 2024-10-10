import React, { useEffect, useRef, useState } from 'react';
import { Chart } from '@antv/g2';

const MyChart = ({ data, yField, yLabel, height }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null); 

  const maxValues = {
    ledPower: 50,
    solarPanelPower: 500,
    batteryPercent: 100,
  };

  useEffect(() => {
    chartInstance.current = new Chart({
      container: chartRef.current,
      autoFit: true,
      height: height,
    });

    chartInstance.current.data(data);
    chartInstance.current.scale({
      timestamp: {
        type: 'time',
        alias: '时间',
        mask: 'YYYY-MM-DD HH:mm:ss',
      },
      [yField]: {
        min: 0,
        max: maxValues[yField],
        alias: yLabel,
      },
    });

    chartInstance.current.line().position(`timestamp*${yField}`).shape('smooth');
    chartInstance.current.point().position(`timestamp*${yField}`).shape('circle');

    chartInstance.current.tooltip({
      showCrosshairs: true,
      shared: true,
      formatter: (item) => ({
        name: yLabel,
        value: item[yField],
      }),
    });

    chartInstance.current.render();

    return () => {
      chartInstance.current.destroy();
    };
  }, [data, yField, yLabel, height]);

  return (
    <div>
      <div ref={chartRef} />
    </div>
  );
};

export default MyChart;
