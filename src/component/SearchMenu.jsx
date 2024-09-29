// src/SearchMenu.js
import React, { useState, useEffect} from 'react';
import { Dropdown, Button, Space, DatePicker, Select, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import moment from 'moment';
import axios from 'axios';  // 导入 axios

const { RangePicker } = DatePicker;
const { Option } = Select;

const SearchMenu = ({ onDataFetched }) => {
  const [dates, setDates] = useState(null);
  const [every, setEvery] = useState('5m');
  const [menuVisible, setMenuVisible] = useState(false);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);

  const presetRanges = [
    { label: '最近1小时', value: [moment().subtract(1, 'hours'), moment()] },
    { label: '最近2小时', value: [moment().subtract(2, 'hours'), moment()] },
    { label: '最近12小时', value: [moment().subtract(12, 'hours'), moment()] },
    { label: '最近1天', value: [moment().subtract(1, 'days'), moment()] },
    { label: '最近3天', value: [moment().subtract(3, 'days'), moment()] },
    { label: '最近7天', value: [moment().subtract(7, 'days'), moment()] },
  ];

  const handleDateChange = (value) => {
    setDates(value);
  };

  const handlePresetRangeClick = (range) => {
    setDates(range);
  };

  const handleEveryChange = (value) => {
    setEvery(value);
  };

  const handleDeviceChange = (value) => {
    const selected = devices.find(device => device.serial === value);
    if (selected) {
      setSelectedDevice(selected.serial);
    }
  };

  // 获取设备列表
  useEffect(() => {
    axios.get('http://localhost:8080/api/device_serial_map')  // 使用 axios 发起请求
      .then(response => {
        setDevices(response.data);  // 将设备数据存储到状态中
      })
      .catch(error => {
        console.error("获取设备列表失败: ", error);
      });
  }, []);

  const handleConfirm = () => {
    if (!selectedDevice) {
      message.error('请选择设备');
      return;
    }
    if (!dates) {
      message.error('请选择时间段');
      return;
    }
    message.success(`时间范围: ${moment(dates[0]).format('YYYY-MM-DD HH:mm')} 到 ${moment(dates[1]).format('YYYY-MM-DD HH:mm')}`);
    message.success(`采样间隔: ${every}`);
    message.success(`设备ID: ${selectedDevice}`);

    // 发起请求，使用 selectedDevice, dates 和 interval 作为请求参数
    axios.post('http://localhost:8080/api/data', {
      device_id: selectedDevice,
      start: dates[0],
      end: dates[1],
      every,
      field: 'battery_percent'
    })
    .then(response => {
      console.log('请求成功:', response.data);
      onDataFetched(response.data);  // 传递数据到 App.js
    })
    .catch(error => {
      console.error('请求失败:', error);
    });
    setMenuVisible(false); // 点击确定后关闭菜单
  };

  const handleCancel = () => {
    setDates(null);
    message.info('已重置');
    setMenuVisible(false); // 点击取消后关闭菜单
  };

  const searchMenu = (
    <div className="custom-dropdown-menu">
      <div style={{ marginBottom: '16px' }}>
        <label>自定义时间范围：</label>
        <RangePicker
          showTime
          format="YYYY-MM-DD HH:mm"
          onChange={handleDateChange}
        />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label>选择设备：</label>
        <Select
          style={{ width: '100%' }}
          placeholder="选择设备"
          onChange={handleDeviceChange}
        >
          {devices.map(device => (
            <Option key={device.serial} value={device.serial}>
              {device.serial}
            </Option>
          ))}
        </Select>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label>预设时间范围：</label>
        <Space wrap>
          {presetRanges.map((range) => (
            <Button
              key={range.label}
              onClick={() => handlePresetRangeClick(range.value)}
            >
              {range.label}
            </Button>
          ))}
        </Space>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label>采样间隔：</label>
        <Select defaultValue="5m" style={{ width: '100%' }} onChange={handleEveryChange}>
          <Option value="1m">1分钟</Option>
          <Option value="5m">5分钟</Option>
          <Option value="10m">10分钟</Option>
          <Option value="30m">30分钟</Option>
          <Option value="1h">1小时</Option>
          <Option value="12h">12小时</Option>
          <Option value="1d">1天</Option>
        </Select>
      </div>

      <div style={{ textAlign: 'right' }}>
        <Space>
          <Button onClick={handleCancel}>取消</Button>
          <Button type="primary" onClick={handleConfirm}>确定</Button>
        </Space>
      </div>
    </div>
  );

  return (
    <Space>
      <Dropdown
        overlay={searchMenu}
        trigger={['click']}
        open={menuVisible}
        onOpenChange={setMenuVisible}
        placement="bottomLeft"
      >
        <Button type="primary" icon={<SearchOutlined />} onClick={() => setMenuVisible(!menuVisible)}>
          搜索
        </Button>
      </Dropdown>
    </Space>
  );
};

export default SearchMenu;