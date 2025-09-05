// Gemini AI Multimodal Generator for Reservio
// Generates both text and images using Gemini 2.5 Flash

import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import mime from 'mime';
import { writeFile } from 'fs';

// Load environment variables
dotenv.config();

function saveBinaryFile(fileName: string, content: Buffer) {
  writeFile(fileName, content, 'binary', (err) => {
    if (err) {
      console.error(`Error writing file ${fileName}:`, err);
      return;
    }
    console.log(`File ${fileName} saved to file system.`);
  });
}

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found in environment variables');
    console.log('Please add your API key to the .env file');
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
          text: `Create a professional logo design for "Reservio" - a modern booking and reservation platform. 
          The logo should be:
          - Clean and modern
          - Professional for business use  
          - Suitable for both web and mobile
          - Include the text "Reservio"
          - Use colors that suggest trust and reliability
          
          Also provide a brief description of the design concept.`,
        },
      ],
    },
  ];

  try {
    console.log('🚀 Generating Reservio logo with Gemini AI...');
    
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
        console.log('📝 AI Response:', chunk.text);
      }
    }
    
    console.log('✅ Generation complete!');
  } catch (error) {
    console.error('❌ Error generating content:', error);
  }
}

main();