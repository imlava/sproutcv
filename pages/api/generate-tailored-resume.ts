// API Route: /api/generate-tailored-resume
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
Based on this resume and job description, create an optimized version that's tailored for this specific role:

ORIGINAL RESUME:
${resumeText}

TARGET JOB DESCRIPTION:
${jobDescription}

JOB TITLE: ${jobTitle}
COMPANY: ${companyName}

Please rewrite the resume to:

1. **Emphasize relevant experience and skills** that match the job requirements
2. **Include job-specific keywords naturally** throughout the content
3. **Reorder sections** to put the most relevant information first
4. **Quantify achievements** with specific numbers and metrics where possible
5. **Align language** with the terminology used in the job description
6. **Optimize for ATS** with proper keyword placement and formatting
7. **Maintain truthfulness** while optimizing presentation
8. **Customize the professional summary** to match the target role
9. **Highlight transferable skills** that apply to this specific position
10. **Add relevant technical skills** that may have been understated

FORMAT REQUIREMENTS:
- Keep the same basic structure (Contact, Summary, Experience, Education, Skills)
- Use bullet points for experience descriptions
- Include specific metrics and achievements
- Use action verbs that match the job description
- Ensure ATS-friendly formatting
- Make it compelling and professional

IMPORTANT: Only enhance and reorganize existing information from the original resume. Do not fabricate experience, skills, or achievements that aren't present in the original.

Provide the complete tailored resume in a clean, professional format.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const tailoredResume = response.text();

    // Clean up the response
    const cleanedResume = tailoredResume
      .replace(/\*\*/g, '') // Remove markdown bold
      .replace(/\*/g, '•') // Convert asterisks to bullet points
      .trim();

    res.status(200).json({
      success: true,
      tailoredResume: cleanedResume,
      jobTitle,
      companyName,
      optimizationApplied: [
        'Keyword optimization',
        'Section reordering',
        'Achievement quantification',
        'ATS formatting',
        'Language alignment'
      ]
    });

  } catch (error) {
    console.error('Tailored resume generation error:', error);
    res.status(500).json({
      error: 'Failed to generate tailored resume',
      details: error.message
    });
  }
}
