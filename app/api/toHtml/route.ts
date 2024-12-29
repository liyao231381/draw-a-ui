import { OpenAI } from "openai";

// 从环境变量中获取 API URL 和 API 密钥
const OPENAI_API_URL = process.env.OPENAI_API_URL; // 从环境变量中获取自定义 API URL
const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // 从环境变量中获取 API 密钥

const systemPrompt = `You are an expert Tailwind developer with a strong understanding of web design principles. 
A user will provide you with a low-fidelity wireframe of an application. Your task is to return a single HTML file 
that uses Tailwind CSS to create a responsive and visually appealing website. 
Feel free to make creative decisions to enhance the application's design and functionality. 
If you need to insert an image, use placehold.co to generate a placeholder image. 
Respond only with the complete HTML file, ensuring it is well-structured and includes necessary meta tags for responsiveness.`;

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
              text: "Turn this into a single html file using tailwind.",
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
