
import { GoogleGenAI, Type } from "@google/genai";
import type { QuizQuestion } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const quizSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      question: {
        type: Type.STRING,
        description: "A pergunta do quiz, em português."
      },
      options: {
        type: Type.ARRAY,
        description: "Um array com 4 strings, representando as opções de resposta em português.",
        items: {
          type: Type.STRING,
        }
      },
      correctAnswerIndex: {
        type: Type.INTEGER,
        description: "O índice (0-3) da resposta correta no array de opções."
      },
      explanation: {
        type: Type.STRING,
        description: "Uma breve explicação em português sobre por que a resposta está correta."
      }
    },
    required: ["question", "options", "correctAnswerIndex", "explanation"],
  }
};

export const generateContent = async (topicTitle: string): Promise<string> => {
    try {
        const prompt = `
            Explique o tópico "${topicTitle}" de forma clara, didática e envolvente para um estudante. 
            Use uma linguagem acessível e exemplos práticos. A resposta deve ser em português do Brasil.
            Estruture a resposta em parágrafos para facilitar a leitura.
            Não inclua o título na sua resposta, apenas o conteúdo explicativo.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text;
    } catch (error) {
        console.error("Error generating content:", error);
        throw new Error("Não foi possível gerar o conteúdo. Tente novamente.");
    }
};

export const generateQuiz = async (topicContent: string): Promise<QuizQuestion[]> => {
    try {
        const prompt = `
            Com base no seguinte texto, crie um quiz com 3 perguntas de múltipla escolha para avaliar o aprendizado de um estudante.
            As perguntas devem ser desafiadoras, mas justas, e cobrir os pontos principais do texto.
            Retorne a resposta estritamente no formato JSON, seguindo o schema fornecido.
            Todo o texto (perguntas, opções, explicações) deve estar em português do Brasil.

            Texto de referência:
            ---
            ${topicContent}
            ---
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: quizSchema,
            }
        });

        const jsonText = response.text.trim();
        const quizData = JSON.parse(jsonText);
        
        // Basic validation
        if (!Array.isArray(quizData) || quizData.length === 0) {
            throw new Error("Formato do quiz inválido recebido da API.");
        }
        
        return quizData as QuizQuestion[];

    } catch (error) {
        console.error("Error generating quiz:", error);
        throw new Error("Não foi possível gerar o quiz. Tente novamente.");
    }
};
