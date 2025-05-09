"use client";

import dynamic from "next/dynamic";
import "@tldraw/tldraw/tldraw.css";
import { useEditor } from "@tldraw/tldraw";
import { getSvgAsImage } from "@/lib/getSvgAsImage";
import { blobToBase64 } from "@/lib/blobToBase64";
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { PreviewModal } from "@/components/PreviewModal";

const Tldraw = dynamic(async () => (await import("@tldraw/tldraw")).Tldraw);

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
    if (typeof window !== 'undefined') {
      const savedHistory = localStorage.getItem("history");
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory)); // 解析并设置历史记录
      }
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
    if (typeof window !== 'undefined') {
      localStorage.setItem("history", JSON.stringify(history)); // 将历史记录保存到 localStorage
    }
  }, [history]);

  // 删除历史记录
  const deleteHistoryItem = (index: number) => {
    const newHistory = history.filter((_, i) => i !== index);
    setHistory(newHistory);
  };

  return (
    <>
      <div className={`w-screen h-screen`}>
        <Tldraw persistenceKey="tldraw">
          <ExportButton setHtml={setHtml} isMobile={isMobile} setHistory={setHistory} history={history} />
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`fixed right-8 ${isMobile ? 'top-2' : 'bottom-4'} bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-1 mr-1 rounded`}
            style={{ zIndex: 1000 }}
          >
            <svg
              className="w-4 h-4"
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
                d="M12 8v4l2 2"
              ></path>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 2a10 10 0 100 20 10 10 0 000-20z"
              ></path>
            </svg>
          </button>
        </Tldraw>
      </div>
      {html && (
        <div
          className="fixed top-0 left-0 right-0 bottom-0 flex justify-center items-center"
          style={{ zIndex: 2000, backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setHtml(null)}
        >
          <PreviewModal html={html} setHtml={setHtml} />
        </div>
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
            <div className="overflow-y-auto" style={{ maxHeight: "calc(100% - 64px)" }}>
              <ul>
                {history.map((item, index) => (
                  <li key={index} className="border-b py-2 flex justify-between items-center">
                    <span className="cursor-pointer" onClick={() => setHtml(item.html)}>
                      {item.time}
                    </span>
                    <button onClick={() => deleteHistoryItem(index)} className="ml-2">
                      <svg
                        className="w-4 h-4 text-red-500 hover:text-red-700"
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
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ExportButton({ setHtml, isMobile, setHistory, history }: { setHtml: (html: string) => void; isMobile: boolean; setHistory: (history: HistoryItem[]) => void; history: HistoryItem[] }) {
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
          const newHistory: HistoryItem[] = [...history, { time: currentTime, html }];
          setHistory(newHistory);
          localStorage.setItem("history", JSON.stringify(newHistory)); // 更新 localStorage
        } finally {
          setLoading(false);
        }
      }}
      className={`fixed right-2 ${isMobile ? 'top-2' : 'bottom-4'} bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-1 rounded`}
      style={{ zIndex: 1000 }}
      disabled={loading}
    >
      {loading ? (
        <div className="flex justify-center items-center ">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        </div>
      ) : (
        "Go"
      )}
    </button>
  );
}
