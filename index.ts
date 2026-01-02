// index.ts

import express = require('express');
import type { Request, Response } from 'express';
import cors = require('cors');
import dotenv = require('dotenv');
const { HfInference } = require('@huggingface/inference');

dotenv.config();

const app = express();
const hf = new HfInference(process.env.HUGGINGFACE_API_TOKEN ?? '');

// middleware
app.use(cors());
app.use(express.json());

// simple health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// generate one JPEG image
app.post('/generate', async (req: Request, res: Response) => {
  try {
    const { headline, productName } = req.body as {
      headline: string;
      productName?: string;
    };

    if (!headline) {
      return res.status(400).json({ error: 'headline is required' });
    }

    const prompt = `${headline}. Product: ${productName ?? ''}. High quality commercial product photography. Award-winning product shot.`;

    console.log('📝 Prompt:', prompt);

    const blob = (await hf.textToImage({
      model: 'stabilityai/stable-diffusion-xl-base-1.0',
      inputs: prompt,
    })) as any;

    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Length', buffer.length.toString());
    return res.send(buffer);
  } catch (err: any) {
    console.error('❌ Error in /generate:', err);
    return res.status(500).json({ error: err?.message || 'Internal server error' });
  }
});

// START SERVER  <-- this was missing / not running before
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
