"use client";

import { useEffect, useState } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-cshtml";
import "prismjs/themes/prism-tomorrow.css";

export function PreviewModal({
  html,
  setHtml,
}: {
  html: string | null; // HTML 内容
  setHtml: (html: string | null) => void; // 设置 HTML 内容的函数
}) {
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview"); // 当前激活的标签
  const [copyMessageVisible, setCopyMessageVisible] = useState(false); // 控制复制提示显示状态

  useEffect(() => {
    const highlight = async () => {
      await Prism.highlightAll(); // 准备 Prism.js 高亮
    };
    highlight(); // 调用异步函数
  }, [html, activeTab]); // 当 html 或 activeTab 更新时执行

  if (!html) {
    return null; // 如果没有 HTML 内容，返回 null
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(html); // 复制 HTML 内容到剪贴板
      setCopyMessageVisible(true); // 显示复制提示
      setTimeout(() => {
        setCopyMessageVisible(false); // 短暂显示后隐藏提示
      }, 2000); // 2秒后隐藏
    } catch (err) {
      console.error("复制失败:", err); // 错误处理
    }
  };

  return (
    <div
      onClick={(e) => {
        e.stopPropagation(); // 阻止点击事件冒泡
      }}
      className="bg-white rounded-lg shadow-xl flex flex-col"
      style={{
        width: "calc(100% - 64px)", // 设置宽度
        height: "calc(100% - 64px)", // 设置高度
      }}
    >
      <div className="flex justify-between items-center p-4 border-b">
        <div className="flex space-x-1">
          <TabButton
            active={activeTab === "preview"}
            onClick={() => {
              setActiveTab("preview");
            }}
          >
            Preview
          </TabButton>
          <TabButton
            active={activeTab === "code"}
            onClick={() => {
              setActiveTab("code");
            }}
          >
            Code
          </TabButton>
        </div>

        <button
          className="p-2 rounded-md hover:bg-gray-200 focus:outline-none focus:ring"
          onClick={() => {
            setHtml(null); // 点击关闭按钮时清空 HTML 内容
          }}
        >
          <svg
            className="w-6 h-6 text-gray-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
        </button>
      </div>

      {activeTab === "preview" ? (
        <iframe className="w-full h-full " srcDoc={html} />
      ) : (
        <div className="relative overflow-auto">
          <button
            onClick={copyToClipboard} // 点击复制按钮
            className="absolute right-4 top-4 pl-2 pr-2 border rounded-md border-blue-500 text-blue-500 hover:bg-blue-100 focus:outline-none transition-transform duration-200 ease-in-out"
            style={{ borderRadius: "5px" }}
          >
            <span className="transition-transform duration-200 ease-in-out active:translate-y-1">copy</span>
          </button>

          {copyMessageVisible && (
            <div className="absolute right-4 top-12 text-blue-300/30 font-light">
              已复制到剪贴板
            </div>
          )}

          <pre className="overflow-auto p-4">
            <code className="language-markup ">{html}</code>
          </pre>
        </div>
      )}
    </div>
  );
}

interface TabButtonProps extends React.HTMLAttributes<HTMLButtonElement> {
  active: boolean; // 判断按钮是否激活
}

function TabButton({ active, ...buttonProps }: TabButtonProps) {
  const className = active
    ? "px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-t-md focus:outline-none "
    : "px-4 py-2 text-sm font-medium text-blue-500 bg-transparent hover:bg-blue-100 focus:bg-blue-100 rounded-t-md focus:outline-none focus:ring";
  return <button className={className} {...buttonProps}></button>; // 渲染按钮
}
