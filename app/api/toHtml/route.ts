import { OpenAI } from "openai";

// 从环境变量中获取 API URL 和 API 密钥
const OPENAI_API_URL = "https://free.v36.cm/v1"; // 从环境变量中获取自定义 API URL
const OPENAI_API_KEY = "sk-S26fjgKnbfujt6Ux61C85330604747Df983aFe93Ab5aC666"; // 从环境变量中获取 API 密钥

const systemPrompt = `You have perfect vision and pay great attention to detail which makes you an expert at building single page apps using Tailwind, HTML, react, alpine.js, jquery and JS.
You take screenshots of a reference web page from the user, and then build single page apps using Tailwind, HTML, react, alpine.js, jquery and JS.
The designs you receive may include wireframes, flow charts, diagrams, labels, arrows, sticky notes, screenshots of other applications, or even previous designs. You treat all of these as references for your prototype, using your best judgement to determine what is an annotation and what should be included in the final result.

- Make sure the app looks exactly like the screenshot.If there is a clearly defined functional logic in the page, please use your knowledge to turn the provided complete webpage or component into a runnable version. If there is no clearly defined functional logic, you can also use your imagination to infer some possible responsive interactions and implement them in the final result.
- Do not leave out smaller UI elements. Make sure to include every single thing in the screenshot.
- Pay close attention to background color, text color, font size, font family, 
padding, margin, border, etc. Match the colors and sizes exactly.
- In particular, pay attention to background color and overall color scheme.
- Use the exact text from the screenshot.
- Do not add comments in the code such as "<!-- Add other navigation links as needed -->" and "<!-- ... other news items ... -->" in place of writing the full code. WRITE THE FULL CODE.
- Make sure to always get the layout right (if things are arranged in a row in the screenshot, they should be in a row in the app as well)
- Repeat elements as needed to match the screenshot. For example, if there are 15 items, the code should have 15 items. DO NOT LEAVE comments like "<!-- Repeat for each news item -->" or bad things will happen.
- For images, use placeholder images from https://unsplash.com/ or https://placehold.co and include a detailed description of the image in the alt text so that an image generation AI can generate the image later.

In terms of libraries,
- Use these script to include React so that it can run on a standalone page:
    <script src="https://unpkg.com/react@18.0.0/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18.0.0/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.js"></script>
- Use Alpine.js: <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
- Use jQuery: <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
- Use this script to include Tailwind: <script src="https://cdn.tailwindcss.com"></script>
- You can use Google Fonts
- Font Awesome for icons: <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css"></link>

Return only the full code in <html></html> tags.
最后需要注意的是，尽可能用中文回答，英文专有名词除外`;

export async function POST(request: Request) {
  // 创建 OpenAI 实例并设置自定义 API URL
  const openai = new OpenAI({
    apiKey: OPENAI_API_KEY, // 使用环境变量中的 API 密钥
    baseURL: OPENAI_API_URL, // 使用环境变量中的自定义 API URL
  });

  try {
    const { image } = await request.json();

    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 4096,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: image, detail: "high" },
            },
            {
              type: "text",
              text: "把最终的结果转换成HTML格式并包含在```html```标签中。",
            },
          ],
        },
      ],
    });

    return new Response(JSON.stringify(resp), {
      headers: {
        "content-type": "application/json; charset=UTF-8",
      },
    });
  } catch (error) {
    console.error("Error occurred while calling OpenAI API:", error);

    // 返回通用错误消息
    return new Response(JSON.stringify({ error: "An error occurred while processing your request." }), {
      status: 500,
      headers: {
        "content-type": "application/json; charset=UTF-8",
      },
    });
  }
}
