import React, { useState } from 'react';
import { Button, Switch } from 'antd';
import { PlayCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import SearchMenu from './component/SearchMenu'; // 导入 SearchMenu 组件
import MyChart from './component/Chart'; // 共享图表组件
import axios from 'axios';  // 导入 axios
import { message } from 'antd'; 
import moment from 'moment';

const App = () => {
  const [data1, setData1] = useState(null);
  const [data2, setData2] = useState(null);
  const [data3, setData3] = useState(null);
  const [searchParams, setSearchParams] = useState(null); // 管理搜索参数
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCollecting, setIsCollecting] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null); // 用于存储定时器ID

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
          axios.post('http://localhost:8080/api/data', {
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
          axios.post('http://localhost:8080/api/data', {
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
      setIsCollecting(true); // 播放开关打开时，采集也打开
      // 每5分钟刷新一次
      try {
        await axios.post('http://localhost:8080/api/collection'); // 打开采集
        message.success('采集已启动'); // 提示用户
      } catch (error) {
        console.error('打开采集失败:', error);
        message.error('打开采集失败');
      }

      const intervalId = setInterval(() => {
        handleRefresh(true);
      }, 5 * 60 * 1000); // 5分钟
      setRefreshInterval(intervalId);
    } else {
      setIsCollecting(false); // 关闭时，同时关闭采集

      try {
        await axios.post('http://localhost:8080/api/close'); // 关闭采集
        message.success('采集已停止'); // 提示用户
      } catch (error) {
        console.error('关闭采集失败:', error);
        message.error('关闭采集失败');
      }

      clearInterval(refreshInterval); // 关闭播放时，清除定时器
      setRefreshInterval(null); // 重置定时器ID
    }
  };
  
  const toggleCollecting = async (checked) => {
    setIsCollecting(checked);
    if (checked) {
      try {
        await axios.post('http://localhost:8080/api/collection'); // 打开采集
        message.success('采集已启动'); // 提示用户
      } catch (error) {
        console.error('打开采集失败:', error);
        message.error('打开采集失败');
      }
    } else {
      try {
        await axios.post('http://localhost:8080/api/close'); // 关闭采集
        message.success('采集已停止'); // 提示用户
      } catch (error) {
        console.error('关闭采集失败:', error);
        message.error('关闭采集失败');
      }
      setIsPlaying(false); // 关闭采集时，播放也关闭
    }
  };

  return (
    <div style={{ padding: 20 }}>
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
        <Switch 
          checked={isCollecting} 
          trackHeight="50"
          handleSize='30'
          onChange={toggleCollecting} 
          style={{ margin: '0 10px' }} 
          checkedChildren="采集" 
          unCheckedChildren="停止" 
        />
      </div>
      <div>
        {data1 && (
          <div style={{ marginBottom: '100px' }}>
            <h3>电量趋势图</h3>
            <MyChart data={data1} yField="batteryPercent" yLabel="电量" />
          </div>
        )}
        {data2 && (
          <div style={{ marginBottom: '100px' }}>
            <h3>太阳能电池板功率趋势图</h3>
            <MyChart data={data2} yField="solarPanelPower" yLabel="太阳能电池板功率" />
          </div>
        )}
        {data3 && (
          <div style={{ marginBottom: '100px' }}>
            <h3>LED功率趋势图</h3>
            <MyChart data={data3} yField="ledPower" yLabel="LED功率" />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
