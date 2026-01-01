// API Route: /api/generate-cover-letter
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextApiRequest, NextApiResponse } from 'next';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      resumeText,
      jobDescription,
      jobTitle,
      companyName,
      userId = 'demo-user'
    } = req.body;

    if (!resumeText || !jobDescription) {
      return res.status(400).json({
        error: 'Resume text and job description are required'
      });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `
Create a compelling cover letter based on this resume and job description:

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

JOB TITLE: ${jobTitle}
COMPANY: ${companyName}

Write a professional cover letter that:
1. Highlights the most relevant experience from the resume
2. Addresses key job requirements specifically
3. Shows genuine enthusiasm for the role and company
4. Uses specific examples and achievements from the resume
5. Is 3-4 paragraphs long with proper structure
6. Has a professional but engaging tone
7. Includes a strong opening and compelling closing

Format as a complete cover letter with:
- Proper greeting (Dear Hiring Manager or specific name if available)
- Professional closing (Sincerely, [Name])
- Clear paragraph structure
- Quantified achievements where possible

Make it personalized and compelling, not generic.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const coverLetter = response.text();

    // Clean up the response
    const cleanedCoverLetter = coverLetter
      .replace(/\*\*/g, '') // Remove markdown bold
      .replace(/\*/g, '') // Remove markdown italics
      .trim();

    res.status(200).json({
      success: true,
      coverLetter: cleanedCoverLetter,
      jobTitle,
      companyName
    });

  } catch (error) {
    console.error('Cover letter generation error:', error);
    res.status(500).json({
      error: 'Failed to generate cover letter',
      details: error.message
    });
  }
}
