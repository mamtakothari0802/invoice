
import { GoogleGenAI, Type } from "@google/genai";
import type { InvoiceData } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const schema = {
  type: Type.OBJECT,
  properties: {
    invoiceNumber: { type: Type.STRING, description: 'The invoice number or ID.' },
    vendorName: { type: Type.STRING, description: 'The name of the company that sent the invoice.' },
    invoiceDate: { type: Type.STRING, description: 'The date the invoice was issued (YYYY-MM-DD).' },
    totalAmount: { type: Type.NUMBER, description: 'The final total amount due.' },
  },
  required: ['invoiceNumber', 'vendorName', 'invoiceDate', 'totalAmount'],
};

export const extractInvoiceData = async (imageBase64: string): Promise<InvoiceData> => {
  const prompt = `
    Analyze the provided invoice image and extract the following information:
    - The invoice number.
    - The name of the vendor or company that issued the invoice.
    - The date of the invoice.
    - The total amount due.
    Return the information in the specified JSON format. If a value is not found, use a reasonable default like "N/A" for strings or 0 for numbers.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("API returned an empty response.");
    }
    
    // Fix: Corrected misleading comment. The response.text from the Gemini API is a JSON string and needs to be parsed.
    const parsedData = JSON.parse(jsonText);
    return parsedData as InvoiceData;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to extract data from invoice: ${error.message}`);
    }
    throw new Error("An unknown error occurred while extracting invoice data.");
  }
};
