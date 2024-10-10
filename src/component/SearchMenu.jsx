import React, { useState, useEffect } from 'react';
import { Dropdown, Button, Space, DatePicker, Select, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import moment from 'moment';
import apiClient from '../apiClient';

const { RangePicker } = DatePicker;
const { Option } = Select;

const SearchMenu = ({ onDataFetched, onSearchParamsChange }) => {
  const [dates, setDates] = useState(null);
  const [every, setEvery] = useState('5m');
  const [menuVisible, setMenuVisible] = useState(false);
  const [deviceNameToId, setDeviceNameToId] = useState({}); // 存储设备名到设备ID的映射
  const [deviceIdToName, setDeviceIdToName] = useState({}); // 存储设备ID到设备名的映射
  const [selectedDeviceName, setSelectedDeviceName] = useState(null); // 选择的设备名
  const [isDropdownDisabled, setIsDropdownDisabled] = useState(false); // 用于控制 Dropdown 的禁用状态

  const presetRanges = [
    { label: '最近1小时', value: [moment().subtract(1, 'hours'), moment()] },
    { label: '最近2小时', value: [moment().subtract(2, 'hours'), moment()] },
    { label: '最近12小时', value: [moment().subtract(12, 'hours'), moment()] },
    { label: '最近1天', value: [moment().subtract(1, 'days'), moment()] },
    { label: '最近3天', value: [moment().subtract(3, 'days'), moment()] },
    { label: '最近7天', value: [moment().subtract(7, 'days'), moment()] },
  ];

  const handleDateChange = (value) => {
    // console.log('选择的日期:', value);
    setDates(value);
    console.log('选择的日期:', dates);
    console.log('选择的日期:', dates[0]);
    console.log('选择的日期:', dates[1]);
  };

  const handlePresetRangeChange = (value) => {
    const selectedRange = presetRanges.find(range => range.label === value);
    if (selectedRange) {
      // console.log('选择的日期:', selectedRange.value);
      setDates(selectedRange.value);
      console.log('选择的日期:', dates);
      console.log('选择的日期:', dates[0]);
      console.log('选择的日期:', dates[1]);
    }
  };

  const handleEveryChange = (value) => {
    setEvery(value);
  };

  // 从设备名查找设备ID
  const getDeviceIdByName = (deviceName) => {
    return deviceNameToId[deviceName];
  };

  // 从设备ID查找设备名
  const getDeviceNameById = (deviceId) => {
    return deviceIdToName[deviceId];
  };

  const handleDeviceChange = (deviceName) => {
    setSelectedDeviceName(deviceName);
  };

  // 获取设备列表
useEffect(() => {
  apiClient.get('/api/device_map')
    .then(response => {
      const { deviceNameToId, deviceIdToName } = response.data;

      // 对设备名进行排序，按设备名后四位数字从小到大排序
      const sortedDeviceNames = Object.keys(deviceNameToId).sort((a, b) => {
        const numA = parseInt(a.slice(-4)); // 获取设备名的后四位数字
        const numB = parseInt(b.slice(-4));
        return numA - numB; // 按数字从小到大排序
      });

      const sortedDeviceNameToId = {};
      sortedDeviceNames.forEach(name => {
        sortedDeviceNameToId[name] = deviceNameToId[name];
      });

      setDeviceNameToId(sortedDeviceNameToId);
      setDeviceIdToName(deviceIdToName);
    })
    .catch(error => {
      console.error("获取设备列表失败: ", error);
    });
}, []);

  const handleConfirm = async () => {
    if (!selectedDeviceName) {
      message.error('请选择设备');
      return;
    }
    if (!dates) {
      message.error('请选择时间段');
      return;
    }

    const selectedDeviceId = getDeviceIdByName(selectedDeviceName);
    const startDate = dates[0].format('YYYY-MM-DD HH:mm');
    const endDate = dates[1].format('YYYY-MM-DD HH:mm');
    message.success(`时间范围: ${startDate} 到 ${endDate}`);
    message.success(`采样间隔: ${every}`);
    message.success(`设备ID: ${selectedDeviceId}`);

    try {
      const fields = ['battery_percent', 'solar_panel_power', 'led_power'];
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
      onDataFetched(...dataSets); // 传递三组数据到 App.js
      onSearchParamsChange({ selectedDeviceId, selectedDeviceName, dates, every });
    } catch (error) {
      console.error('请求失败:', error);
    }
    setMenuVisible(false);
  };

  const handleCancel = () => {
    setDates(null);
    message.info('已重置');
    setMenuVisible(false); // 点击取消后关闭菜单
  };

  // 监听窗口大小变化并动态设置 disabled 属性
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 800) {
        setIsDropdownDisabled(true); // 当窗口宽度小于1000px时，禁用 Dropdown
        setMenuVisible(false); // 关闭菜单
      }
      if (window.innerWidth > 800 ) {
        setIsDropdownDisabled(false); // 恢复 Dropdown
        // setMenuVisible(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // 初始化时调用一次以设置初始状态

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const searchMenu = (
    <div 
      className="custom-dropdown-menu"
      style={{
        backgroundColor: 'white', // 设置白色背景
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)', // 添加阴影
        padding: '16px', // 添加一些内边距
        borderRadius: '8px', // 圆角效果，可以根据需求调整
      }}
    >
      <div style={{ marginTop: '16px' }}>
        <label>自定义时间范围：</label>
        <RangePicker
          showTime
          format="YYYY-MM-DD HH:mm"
          onChange={handleDateChange}
        />
      </div>

      <div style={{ marginTop: '16px' }}>
        <label>选择设备：</label>
        <Select
          style={{ width: '407px' }}
          placeholder="选择设备"
          onChange={handleDeviceChange}
        >
          {Object.keys(deviceNameToId).map(deviceName => (
            <Option key={deviceName} value={deviceName}>
              {deviceName}
            </Option>
          ))}
        </Select>
      </div>

      <div style={{ marginTop: '16px' }}>
        <label>预设时间范围：</label>
        <Select
          style={{ width: '380px' }}
          placeholder="选择预设时间范围"
          onChange={handlePresetRangeChange}
        >
          {presetRanges.map(range => (
            <Option key={range.label} value={range.label}>
              {range.label}
            </Option>
          ))}
        </Select>
      </div>

      <div style={{ marginTop: '16px' }}>
        <label>采样间隔：</label>
        <Select defaultValue="5m" style={{ width: '407px' }} onChange={handleEveryChange}>
          <Option value="1m">1分钟</Option>
          <Option value="5m">5分钟</Option>
          <Option value="10m">10分钟</Option>
          <Option value="30m">30分钟</Option>
          <Option value="1h">1小时</Option>
          <Option value="12h">12小时</Option>
          <Option value="1d">1天</Option>
        </Select>
      </div>

      <div style={{ marginTop: '16px' , textAlign: 'right' }}>
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
        disabled={isDropdownDisabled} // 使用动态 disabled 属性
      >
        <Button type="primary" icon={<SearchOutlined />} onClick={() => setMenuVisible(!menuVisible)}>
          搜索
        </Button>
      </Dropdown>
    </Space>
  );
};

export default SearchMenu;
