// app/page.tsx
'use client'; // 如果需要交互（如点击事件），加上这行

import { useState } from 'react';

export default function Home() {
  const [count, setCount] = useState(0);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-2xl w-full bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
          欢迎来到我的 Next.js 应用
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          这是使用 React + Next.js + TypeScript 构建的简单首页。
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => setCount(count + 1)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-md"
          >
            点击次数：{count}
          </button>
          <button
            onClick={() => setCount(0)}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition"
          >
            重置
          </button>
        </div>
        <p className="mt-6 text-sm text-gray-400">
          当前时间：{new Date().toLocaleTimeString()}
        </p>
      </div>
    </main>
  );
}