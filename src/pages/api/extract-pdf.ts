import type { NextApiRequest, NextApiResponse } from 'next';
import pdfParse from 'pdf-parse';
import type { File } from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Use formidable to handle file upload
  const { IncomingForm } = await import('formidable');
  const form = new IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to parse form' });
    }
    let file = files.file as File | File[] | undefined;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    if (Array.isArray(file)) {
      file = file[0];
    }
    try {
      const data = await pdfParse(file.filepath);
      return res.status(200).json({ text: data.text });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Failed to parse PDF' });
    }
  });
} 