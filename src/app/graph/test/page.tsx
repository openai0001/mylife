
'use client';

import { HumanMessage } from '@langchain/core/messages';
import { RemoteRunnable } from "@langchain/core/runnables/remote";
import { Typography } from 'antd';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
const { Paragraph, Title } = Typography;

export default function Home() {
  const pathname = usePathname();
  const [markdownContent, setMarkdownContent] = useState<string>('');
  
  const [data, setData] = useState<any[]>([])
  const bufferRef = useRef<string>(''); // 使用 ref 存储当前的内容
  let last_input = ""
  useEffect(() => {
    const url = new URL(window.location.href)
    const input = url.searchParams.get('input');
    console.log("hello??",input)
    if (!input || input == last_input) return;
    //last_input = input
    const fetchData = async () => {
      try {
        const remoteChain = new RemoteRunnable({
          url: 'http://localhost:8000/test_graph',
        });
        const messages = [new HumanMessage({ content: input })]
        const eventStream = remoteChain.streamEvents({ "messages": messages }, {
          version: "v1",
          configurable: {
            thread_id: "youht-default",
          },
        });
        const node_set = new Set()
        for await (const event of eventStream) {
          console.log(event)
          if (event.event === "on_chain_stream" && event.data.chunk.messages) {
            data.push({ "id": event.run_id, "event": event.event, "name": event.name, "content": event.data.chunk.messages[0].content })
            setData(data)
            console.log(node_set, event.name)
            if (!node_set.has(event.name)) {
              node_set.add(event.name)
              console.log(event.data.chunk.messages[0].content, event.name)
              bufferRef.current += event.data.chunk.messages[0].content; // 累积所有 chunks
              setMarkdownContent(bufferRef.current);
            }
          }
        }
        const res = await remoteChain.stream({ "messages": messages }, {
          configurable: {
            thread_id: "youht-default",
          },
        });
        let chunks = ""
        for await (const chunk of res){
            console.log(chunk,typeof(chunk),Object.keys(chunk as object))
            const id = data.length
            const key = Object.keys(chunk as object)[0]
            const chunk_key = chunk[key]
            const item = {"id": id ,"content": chunk_key.messages[0].content }
            setData((prevItems)=>[...prevItems,item])  
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
      {data.length}
      <div style={containerStyle}>
        <ul>
          {data.map(item => (<li key={(item.id)}><ReactMarkdown>{item.content}</ReactMarkdown></li>))}
        </ul>
      </div>
    </div>
  );

}