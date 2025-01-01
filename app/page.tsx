"use client";

import dynamic from "next/dynamic";
import "@tldraw/tldraw/tldraw.css";
import { useEditor } from "@tldraw/tldraw";
import { getSvgAsImage } from "@/lib/getSvgAsImage";
import { blobToBase64 } from "@/lib/blobToBase64";
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { PreviewModal } from "@/components/PreviewModal";

const Tldraw = dynamic(async () => (await import("@tldraw/tldraw")).Tldraw, {
  ssr: false,
});

interface HistoryItem {
  time: string;
  html: string;
}

export default function Home() {
  const [html, setHtml] = useState<null | string>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // 从 localStorage 加载历史记录
  useEffect(() => {
    const savedHistory = localStorage.getItem("history");
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory)); // 解析并设置历史记录
    }
  }, []);

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 640);
    };

    handleResize(); // 初始化状态

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // 监听键盘事件
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setHtml(null);
        setShowHistory(false);
      }
    };
    window.addEventListener("keydown", listener);

    return () => {
      window.removeEventListener("keydown", listener);
    };
  }, []);

  // 更新 localStorage 中的历史记录
  useEffect(() => {
    localStorage.setItem("history", JSON.stringify(history)); // 将历史记录保存到 localStorage
  }, [history]);

  return (
    <>
      <div className={`w-screen h-screen`}>
        <Tldraw persistenceKey="tldraw">
          <ExportButton setHtml={setHtml} isMobile={isMobile} setHistory={setHistory} />
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`fixed right-12 ${isMobile ? 'top-2' : 'bottom-4'} bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-2 rounded`}
            style={{ zIndex: 1000 }}
          >
            历史记录
          </button>
        </Tldraw>
      </div>
      {html && ReactDOM.createPortal(
        <div
          className="fixed top-0 left-0 right-0 bottom-0 flex justify-center items-center"
          style={{ zIndex: 2000, backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setHtml(null)}
        >
          <PreviewModal html={html} setHtml={setHtml} />
        </div>,
        document.body
      )}
      {showHistory && (
        <div className="fixed top-0 left-0 right-0 bottom-0 flex justify-center items-center" style={{ zIndex: 2000, backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white p-4 rounded shadow-md"
              style={{
                width: "calc(100% - 64px)",
                height: "calc(100% - 64px)",
              }}>
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">历史记录</h2>
                <button onClick={() => setShowHistory(false)} 
                className="text-gray-600 hover:text-gray-800 focus:outline-none"
                >
                <svg
                  className="w-6 h-6"
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
            <ul>
              {history.map((item, index) => (
                <li key={index} className="border-b py-2 cursor-pointer" onClick={() => setHtml(item.html)}>
                  {item.time}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

function ExportButton({ setHtml, isMobile, setHistory }: { setHtml: (html: string) => void; isMobile: boolean; setHistory: (history: HistoryItem[]) => void }) {
  const editor = useEditor();
  const [loading, setLoading] = useState(false);

  return (
    <button
      onClick={async (e) => {
        setLoading(true);
        try {
          e.preventDefault();
          const svg = await editor.getSvg(
            Array.from(editor.currentPageShapeIds)
          );
          if (!svg) {
            return;
          }
          const png = await getSvgAsImage(svg, {
            type: "png",
            quality: 1,
            scale: 1,
          });
          const dataUrl = await blobToBase64(png!);
          const resp = await fetch("/api/toHtml", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ image: dataUrl }),
          });

          const json = await resp.json();

          if (json.error) {
            alert("Error from open ai: " + JSON.stringify(json.error));
            return;
          }

          const message = json.choices[0].message.content;
          const start = message.indexOf("<!DOCTYPE html>");
          const end = message.indexOf("</html>");
          const html = message.slice(start, end + "</html>".length);
          setHtml(html);

          // 记录当前时间
          const currentTime = new Date().toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });

          // 更新历史记录
          setHistory(prev => {
            const newHistory: HistoryItem[] = [...prev, { time: currentTime, html }];
            localStorage.setItem("history", JSON.stringify(newHistory)); // 更新 localStorage
            return newHistory; // 返回新的历史记录
          });
        } finally {
          setLoading(false);
        }
      }}
      className={`fixed right-2 ${isMobile ? 'top-2' : 'bottom-4'} bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-2 rounded`}
      style={{ zIndex: 1000 }}
      disabled={loading}
    >
      {loading ? (
        <div className="flex justify-center items-center ">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        </div>
      ) : (
        "生成"
      )}
    </button>
  );
}
