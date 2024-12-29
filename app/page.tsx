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

export default function Home() {
  const [html, setHtml] = useState<null | string>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 640); // 640px 及以下为移动设备
    };

    handleResize(); // 初始化状态

    window.addEventListener('resize', handleResize); // 监听窗口大小变化
    return () => {
      window.removeEventListener('resize', handleResize); // 清理事件监听器
    };
  }, []);

  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setHtml(null);
      }
    };
    window.addEventListener("keydown", listener);

    return () => {
      window.removeEventListener("keydown", listener);
    };
  }, []);

  return (
    <>
      <div className={`w-screen h-screen`}>
        <Tldraw persistenceKey="tldraw">
          <ExportButton setHtml={setHtml} isMobile={isMobile} />
        </Tldraw>
      </div>
      {html &&
        ReactDOM.createPortal(
          <div
            className="fixed top-0 left-0 right-0 bottom-0 flex justify-center items-center"
            style={{ zIndex: 2000, backgroundColor: "rgba(0,0,0,0.5)" }}
            onClick={() => setHtml(null)}
          >
            <PreviewModal html={html} setHtml={setHtml} />
          </div>,
          document.body
        )}
    </>
  );
}

function ExportButton({ setHtml, isMobile }: { setHtml: (html: string) => void; isMobile: boolean }) {
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
        "转换为 HTML"
      )}
    </button>
  );
}
