import React, { useState, useEffect } from 'react';
import { Button, Switch } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import SearchMenu from './component/SearchMenu'; // 导入 SearchMenu 组件
import MyChart from './component/Chart'; // 共享图表组件
import { message } from 'antd'; 
import moment from 'moment';
import apiClient from './apiClient';

const App = () => {
  const [data1, setData1] = useState(null);
  const [data2, setData2] = useState(null);
  const [data3, setData3] = useState(null);
  const [searchParams, setSearchParams] = useState(null); // 管理搜索参数
  const [isPlaying, setIsPlaying] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null); // 用于存储定时器ID
  const [chartHeight, setChartHeight] = useState(0);

  useEffect(() => {
    // 获取当前窗口的高度，并计算每个图表的高度
    const totalHeight = window.innerHeight - 300; // 减去顶部搜索菜单和按钮的高度
    const chartsCount = [data1, data2, data3].filter(Boolean).length;
    setChartHeight(chartsCount > 0 ? totalHeight / chartsCount : 0);
  }, [data1, data2, data3]);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
  };

  const handleDataFetched = (fetchedData1, fetchedData2, fetchedData3) => {
    const processedData1 = fetchedData1.map(item => ({
      ...item,
      timestamp: formatTimestamp(item.timestamp),
    }));
    const processedData2 = fetchedData2.map(item => ({
      ...item,
      timestamp: formatTimestamp(item.timestamp),
    }));
    const processedData3 = fetchedData3.map(item => ({
      ...item,
      timestamp: formatTimestamp(item.timestamp),
    }));

    setData1(processedData1);
    setData2(processedData2);
    setData3(processedData3);
  };

  const handleSearchParamsChange = (params) => {
    setSearchParams(params); // 更新搜索参数
  };

  const handleRefresh = async (fromPlay = false) => {
    if (!searchParams) {
      message.error('没有搜索参数，请先选择设备和时间范围。'); // 显示错误提示
      return; // 如果没有参数，则不执行刷新
    }
    const { selectedDevice, dates, every } = searchParams; // 获取保存的搜索参数
    if (!selectedDevice || !dates) {
      message.error('请确保设备和时间范围已选择。'); // 显示错误提示
      return; // 如果没有参数，则不执行刷新
    }
    console.log(fromPlay);
    try {
      const fields = ['battery_percent', 'solar_panel_power', 'led_power']; // 根据需求定义字段
      if(fromPlay){
        const currentTime = moment(); // 获取当前时间
        const requests = fields.map(field =>
          apiClient.post('/api/data', {
            device_id: selectedDevice,
            start: dates[0],
            end: currentTime,
            every,
            field,
          })
        );
        const responses = await Promise.all(requests);
        const dataSets = responses.map(response => response.data);
        handleDataFetched(...dataSets); // 更新图表数据
      }else{
        const requests = fields.map(field =>
          apiClient.post('/api/data', {
            device_id: selectedDevice,
            start: dates[0],
            end: dates[1],
            every,
            field,
          })
        );
        const responses = await Promise.all(requests);
        const dataSets = responses.map(response => response.data);
        handleDataFetched(...dataSets); // 更新图表数据
      }
    } catch (error) {
      console.error('请求失败:', error);
    }
  };

  const togglePlaying = async (checked) => {
    setIsPlaying(checked);
    if (checked) {
      // 每1分钟刷新一次
      const intervalId = setInterval(() => {
        handleRefresh(true);
      }, 1 * 60 * 1000); // 1分钟
      setRefreshInterval(intervalId);
    } else {
      clearInterval(refreshInterval); // 关闭播放时，清除定时器
      setRefreshInterval(null); // 重置定时器ID
    }
  };

  return (
    <div style={{ padding: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <SearchMenu onDataFetched={handleDataFetched} onSearchParamsChange={handleSearchParamsChange}/>
        <Button icon={<ReloadOutlined />} style={{ marginLeft: 10 }} onClick={handleRefresh}>刷新</Button>
        <Switch
          checked={isPlaying}
          onChange={togglePlaying}
          style={{ margin: '0 10px' }}
          checkedChildren="播放"
          unCheckedChildren="停止"
        />
      </div>
      <div>
        {data1 && (
          <div style={{ marginBottom: '0px' }}>
            <h5>电量趋势图</h5>
            <MyChart data={data1} yField="batteryPercent" yLabel="电量" height={chartHeight} />
          </div>
        )}
        {data2 && (
          <div style={{ marginBottom: '0px' }}>
            <h5>功率趋势图</h5>
            <MyChart data={data2} yField="solarPanelPower" yLabel="太阳能电池板功率" height={chartHeight} />
          </div>
        )}
        {data3 && (
          <div style={{ marginBottom: '0px' }}>
            <h5>负载趋势图</h5>
            <MyChart data={data3} yField="ledPower" yLabel="LED功率" height={chartHeight} />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
