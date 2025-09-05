import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import mime from 'mime';
import { writeFile } from 'fs';

// Load environment variables
dotenv.config();

function saveBinaryFile(fileName: string, content: Buffer) {
  writeFile(fileName, content, 'utf8', (err) => {
    if (err) {
      console.error(`Error writing file ${fileName}:`, err);
      return;
    }
    console.log(`File ${fileName} saved to file system.`);
  });
}

async function testGemini() {
  if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY not found in environment variables');
    return;
  }

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  const config = {
    responseModalities: [
      'IMAGE',
      'TEXT',
    ],
  };

  const model = 'gemini-2.5-flash-image-preview';
  const contents = [
    {
      role: 'user',
      parts: [
        {
          text: 'Create a professional logo concept for a booking platform called "Reservio" - make it modern and clean',
        },
      ],
    },
  ];

  try {
    console.log('Testing Gemini AI integration...');
    const response = await ai.models.generateContentStream({
      model,
      config,
      contents,
    });

    let fileIndex = 0;
    for await (const chunk of response) {
      if (!chunk.candidates || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
        continue;
      }

      if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
        const fileName = `reservio_logo_${fileIndex++}`;
        const inlineData = chunk.candidates[0].content.parts[0].inlineData;
        const fileExtension = mime.getExtension(inlineData.mimeType || '');
        const buffer = Buffer.from(inlineData.data || '', 'base64');
        saveBinaryFile(`${fileName}.${fileExtension}`, buffer);
      } else {
        console.log(chunk.text);
      }
    }
    console.log('Gemini AI test completed successfully!');
  } catch (error) {
    console.error('Error testing Gemini AI:', error);
  }
}

testGemini();