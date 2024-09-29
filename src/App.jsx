import React, { useState } from 'react';
import { Button} from 'antd';
import { PlayCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import SearchMenu from './component/SearchMenu'; // 导入 SearchMenu 组件
// npm 
import MyChart from './component/Chart';

const App = () => {
  const [data, setData] = useState(null);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
  };

  const handleDataFetched = (fetchedData) => {
    // 处理数据，转换 timestamp
    const processedData = fetchedData.map(item => ({
      ...item,
      timestamp: formatTimestamp(item.timestamp),
    }));
    setData(processedData);
    console.log('Fetched data:', processedData);
  };


  

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <SearchMenu onDataFetched={handleDataFetched} /> {}
        <Button icon={<PlayCircleOutlined />} style={{ margin: 10 }}>播放</Button>
        <Button icon={<ReloadOutlined />} style={{ marginTop: 10 }}>刷新</Button>
      </div>
      <div>
        {data && <MyChart data={data} />}
        {/* <LineChart /> */}
      </div>
    </div>
  );
};

export default App;
