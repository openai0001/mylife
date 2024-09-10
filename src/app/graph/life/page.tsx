
'use client';

import { HumanMessage } from '@langchain/core/messages';
import { RemoteRunnable } from "@langchain/core/runnables/remote";
import { Typography } from 'antd';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
const { Paragraph, Title } = Typography;
export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const bufferRef = useRef<string>(''); // 使用 ref 存储当前的内容
  useEffect(() => {
    const url = new URL(window.location.href)
    const input = url.searchParams.get('input');
    if (!input) return;
    const fetchData = async () => {
      try {
        const remoteChain = new RemoteRunnable({
          url: 'http://localhost:8000/life',
        });
        const messages = [new HumanMessage({content:input})]
        const eventStream = remoteChain.streamEvents(messages,{
          version: "v1",
          metadata: {
            conversation_id: "youht-default",
          },
        });
        let chunks = ""
        for await (const event of eventStream) {
          console.log(event)
          if (event.event === "on_chat_model_stream") {
            bufferRef.current += event.data.chunk.content; // 累积所有 chunks
            setMarkdownContent(bufferRef.current);
          }
         }

      } catch (error) {
        console.log("error fetching data", error);
      }
    }
    fetchData();
  }, [pathname]);
  // 内联样式
  const containerStyle = {
    border: '1px solid #dcdcdc', // 边框颜色
    borderRadius: '4px', // 圆角
    padding: '16px', // 内边距
    margin: '16px', // 外边距
    backgroundColor: '#f9f9f9', // 背景颜色
  };
  return (
    <div>
      <Typography.Title level={2}>Streaming Response:</Typography.Title>
      <div style={containerStyle}>
        <ReactMarkdown>{markdownContent}</ReactMarkdown>
      </div>
    </div>
  );

}