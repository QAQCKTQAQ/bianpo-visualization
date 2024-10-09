// apiClient.js
import axios from 'axios';

// 创建一个 Axios 实例
const apiClient = axios.create({
  baseURL: 'http://localhost:8080', // 基础 URL
  timeout: 10000, // 请求超时设置
});

// // 可选：添加请求拦截器
// apiClient.interceptors.request.use(
//   (config) => {
//     // 在发送请求之前做些什么
//     // 例如：添加 Authorization 头
//     // config.headers['Authorization'] = 'Bearer your_token';
//     return config;
//   },
//   (error) => {
//     // 处理请求错误
//     return Promise.reject(error);
//   }
// );

// // 可选：添加响应拦截器
// apiClient.interceptors.response.use(
//   (response) => {
//     // 处理响应数据
//     return response;
//   },
//   (error) => {
//     // 处理响应错误
//     return Promise.reject(error);
//   }
// );

export default apiClient;