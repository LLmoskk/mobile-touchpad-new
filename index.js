import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Server } from 'socket.io';
import { networkInterfaces } from 'os';
import chalk from 'chalk';
import { mouse, Point } from '@nut-tree/nut-js';

const app = express();
const server = createServer(app);
const io = new Server(server);

const __dirname = dirname(fileURLToPath(import.meta.url));

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

// 记录初始触摸位置和当前鼠标位置
let initialTouchPos = null;
let currentMousePos = null;

io.on('connection', (socket) => {
  socket.on('touch', async (data) => {
    try {
      if (data.type === 'panstart') {
        initialTouchPos = { x: data.x, y: data.y };
        currentMousePos = await mouse.getPosition();
      } else if (data.type === 'panmove' && initialTouchPos && currentMousePos) {
        // 计算触摸移动的距离
        const deltaX = data.x - initialTouchPos.x;
        const deltaY = data.y - initialTouchPos.y;

        // 移动鼠标到新位置
        const newX = currentMousePos.x + deltaX;
        const newY = currentMousePos.y + deltaY;
        await mouse.setPosition(new Point(newX, newY));

        // 更新初始位置和当前鼠标位置
        initialTouchPos = { x: data.x, y: data.y };
        currentMousePos = { x: newX, y: newY };
      } else if (data.type === 'tap') {
        await mouse.leftClick();
      }
    } catch (error) {
      console.error('Mouse control error:', error);
    }
  });
});

server.listen(3000, () => {
  const interfaces = networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const int of interfaces[name]) {
      // 只获取 IPv4 地址
      if (int.family === 'IPv4') {
        addresses.push(`http://${int.address}:3000`);
      }
    }
  }

  console.log('服务器已启动，可通过以下地址访问：');
  addresses.forEach(addr => console.log(chalk.cyan(addr)));
});