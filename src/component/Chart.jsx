// src/component/Chart.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Chart } from '@antv/g2';
import { Slider } from 'antd';

const MyChart = ({ data, yField, yLabel }) => {
  const chartRef = useRef(null);
  const [sliderRange, setSliderRange] = useState([0, 100]);
  const chartInstance = useRef(null); // 用于保存图表实例

  useEffect(() => {
    chartInstance.current = new Chart({
      container: chartRef.current,
      autoFit: true,
      height: 500,
    });

    chartInstance.current.data(data);
    chartInstance.current.scale({
        timestamp: {
          type: 'time',
          alias: '时间',
          mask: 'YYYY-MM-DD HH:mm:ss', // 确保显示格式
        },
        [yField]: {
          min: 0,
          alias: yLabel,
        },
    });
    
    chartInstance.current.line().position(`timestamp*${yField}`).shape('smooth');
    chartInstance.current.point().position(`timestamp*${yField}`).shape('circle');

    chartInstance.current.tooltip({
        showCrosshairs: true,
        shared: true,
        formatter: (item) => {
          return {
            name: yLabel, // 使用传入的 yLabel
            value: item[yField], // 显示对应 yField 的值
          };
        },
    });

    
    chartInstance.current.render();

    return () => {
      chartInstance.current.destroy(); // 清理
    };
  }, [data, yField, yLabel]);

  const handleSliderChange = (value) => {
    const [start, end] = value;
    setSliderRange(value);

    // 过滤数据以反映 Slider 的范围
    const filteredData = data.slice(start, end + 1); // 注意这里的过滤
    chartInstance.current.changeData(filteredData); // 更新图表数据
  };

  return (<div>
    <div ref={chartRef} />
    <Slider
      range
      value={sliderRange}
      min={0}
      max={data.length - 1}
      onChange={handleSliderChange}
      style={{ marginTop: 20 }} // 增加 Slider 的顶部间距
    />
  </div>);
};

export default MyChart;
