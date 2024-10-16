import React, { useState, useEffect, useRef } from 'react';
import { Button, Switch, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import SearchMenu from './component/SearchMenu'; // 导入 SearchMenu 组件
import MyChart from './component/Chart'; // 共享图表组件
import { message } from 'antd'; 
import moment from 'moment';
import apiClient from './apiClient';

const { Title } = Typography;

const App = () => {
  const [data1, setData1] = useState(null);
  const [data2, setData2] = useState(null);
  const [data3, setData3] = useState(null);
  const [searchParams, setSearchParams] = useState(null); // 管理搜索参数
  const [isPlaying, setIsPlaying] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null); // 用于存储定时器ID
  const [chartHeight, setChartHeight] = useState(0);
  const [selectedDeviceName, setSelectedDeviceName] = useState(''); // 新增状态来保存设备名称
  const [over100Duration, setOver100Duration] = useState(''); // 新增状态来保存大于100点数的时长


  useEffect(() => {
    // 获取当前窗口的高度，并计算每个图表的高度
    const totalHeight = window.innerHeight - 330; // 减去顶部搜索菜单和按钮的高度
    const chartsCount = [data1, data2, data3].filter(Boolean).length;
    setChartHeight(chartsCount > 0 ? totalHeight / chartsCount : 0);
  }, [data1, data2, data3]);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
  };

  const calculateDuration1 = async(params) => {
    const response = await apiClient.post('/api/data', {
        device_id: params.selectedDeviceId,
        start: params.dates[0],
        end: params.dates[1],
        every: '5m',
        field: 'solar_panel_power',
      })
    const data = response.data;
    return data
  };

  const calculateDuration2 = (data) => {
    const filteredData = data.filter(point => point.solarPanelPower > 100);
    const pointCount = filteredData.length
    let totalMinutes = 0;
    totalMinutes = 5 * pointCount;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}小时${minutes}分钟`;
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

  const handleSearchParamsChange = async(params) => {
    setSearchParams(params); // 更新搜索参数
    // 更新设备名称
    if (params.selectedDeviceName) {
      setSelectedDeviceName(params.selectedDeviceName); // 假设 selectedDevice 是设备名称
    }
    const DATA = await calculateDuration1(params);
    setOver100Duration(calculateDuration2(DATA));
    
  };
  const handleRefresh = async (fromPlay = false) => {
    if (!searchParams) {
      message.error('没有搜索参数，请先选择设备和时间范围。'); // 显示错误提示
      return; // 如果没有参数，则不执行刷新
    }
    const { selectedDeviceId, dates, every } = searchParams; // 获取保存的搜索参数
    if (!selectedDeviceId || !dates) {
      message.error('请确保设备和时间范围已选择。'); // 显示错误提示
      return; // 如果没有参数，则不执行刷新
    }
    try {
      const fields = ['battery_percent', 'solar_panel_power', 'led_power']; // 根据需求定义字段
      if (!fromPlay) {
        const currentTime = moment(); // 获取当前时间
        const requests = fields.map(field =>
          apiClient.post('/api/data', {
            device_id: selectedDeviceId,
            start: dates[0],
            end: currentTime,
            every,
            field,
          })
        );
        const responses = await Promise.all(requests);
        const dataSets = responses.map(response => response.data);
        handleDataFetched(...dataSets); // 更新图表数据
      } else {
        const requests = fields.map(field =>
          apiClient.post('/api/data', {
            device_id: selectedDeviceId,
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
      if (refreshInterval) {
        clearInterval(refreshInterval); // 清除之前的定时器
      }
      const intervalId = setInterval(() => {
        handleRefresh(false);
      }, 5 * 60 * 1000);
      setRefreshInterval(intervalId);
    } else {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  };

  // 添加初始数据加载的 useEffect
  useEffect(() => {
    const loadDefaultData = async () => {
      const defaultDeviceId = 'nj2ykm5rq8tdyq3o2023101720774144'; // 默认设备ID
      const defaultDeviceName = 'ZJ-LS-JY_1-0001'; // 默认设备名称
      const defaultDates = [moment().subtract(24, 'hours'), moment()]; // 默认时间范围，最近24小时
      const defaultEvery = '5m'; // 默认采样间隔

      const fields = ['battery_percent', 'solar_panel_power', 'led_power'];

      try {
        const requests = fields.map(field =>
          apiClient.post('/api/data', {
            device_id: defaultDeviceId,
            start: defaultDates[0],
            end: defaultDates[1],
            every: defaultEvery,
            field,
          })
        );
        const responses = await Promise.all(requests);
        const dataSets = responses.map(response => response.data);
        handleDataFetched(...dataSets); // 更新图表数据

        // 更新搜索参数
        setSearchParams({
          selectedDeviceId: defaultDeviceId,
          selectedDeviceName: defaultDeviceName,
          dates: defaultDates,
          every: defaultEvery,
        });
        setSelectedDeviceName(defaultDeviceName); // 显示设备名称
      } catch (error) {
        console.error('加载默认数据失败:', error);
      }
    };

    loadDefaultData(); // 在组件挂载时加载默认数据
  }, []);

  // 添加 useEffect，当 searchParams 改变时，如果播放状态为打开则关闭播放
  useEffect(() => {
    if (isPlaying) {
      togglePlaying(false); // 如果播放状态为打开，关闭它
    }
  }, [searchParams]); // 依赖 searchParams，当其变化时触发

  return (
    <div style={{ padding: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            当前设备: {selectedDeviceName}
          </Title>
            <div style={{ fontSize: '16px', marginTop: '4px' }}>
              日照时长：{over100Duration}
            </div>
        </div>
        <div>
          <SearchMenu onDataFetched={handleDataFetched} onSearchParamsChange={handleSearchParamsChange} />
          <Button icon={<ReloadOutlined />} style={{ marginLeft: 10 }} onClick={handleRefresh}>刷新</Button>
          <Switch
            checked={isPlaying}
            onChange={togglePlaying}
            style={{ margin: '0 10px' }}
            checkedChildren="播放"
            unCheckedChildren="停止"
          />
        </div>
        
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
