/**
 * Text truncation utility that preserves structure and important content
 * while reducing token count to fit within model limits (~6000 chars safe margin for 8k tokens).
 */

const MAX_SUBMISSION_CHARS = 6000; // Safe margin: ~6000 chars ≈ 1500 tokens
const MAX_SYLLABUS_CHARS = 3000;   // Syllabus usually doesn't need to be full

interface TruncationResult {
  submission: string;
  syllabus: string;
  truncationApplied: boolean;
  originalLengths: { submission: number; syllabus: number };
}

/**
 * Extract first occurrence of markers like "18/20", "IG", "G", "VG" with context
 */
function extractMarkerContext(text: string): string {
  const markerPatterns = [
    /\b\d{1,2}\s*\/\s*20\b/,    // "18/20" or "18 / 20"
    /\b(IG|G|VG)\b/,             // Grading letters
    /Points?:\s*[\dA-Z\/]+/i,     // "Points: 18/20"
  ];

  for (const pattern of markerPatterns) {
    const match = text.search(pattern);
    if (match !== -1) {
      // Get ~200 chars around the match
      const start = Math.max(0, match - 100);
      const end = Math.min(text.length, match + 200);
      return text.slice(start, end);
    }
  }

  return "";
}

/**
 * Intelligently truncate submission text while preserving structure
 */
function truncateSubmission(text: string): string {
  if (text.length <= MAX_SUBMISSION_CHARS) {
    return text;
  }

  // Strategy: Find the actual exam questions and answers (skipping instructions/headers)
  // Look for markers that indicate start of real questions: "1 SQLite", "2", "3", etc. or "-- X of Y --"
  
  // Pattern 1: Look for page markers like "-- 1 of 4 --" which indicate start of real content
  const pageMarkerMatch = text.search(/--\s*\d+\s+of\s+\d+\s*--/);
  let startPos = 0;
  
  if (pageMarkerMatch > 0) {
    // Start after the first page marker (questions usually start after metadata)
    startPos = pageMarkerMatch + 100;
  } else {
    // Fallback: look for numbered questions starting (1, 2, 3, etc.)
    const questionMatch = text.search(/\n\d\s+[A-Za-z]/);
    if (questionMatch > 0) {
      startPos = questionMatch;
    }
  }

  // Extract from the identified start position to end
  let result = text.slice(startPos);

  // If still too long, prioritize: questions 1-8 + marks + last part (essayquestion often last)
  if (result.length > MAX_SUBMISSION_CHARS) {
    // Find rough sections
    const marksContext = extractMarkerContext(text);
    
    // Try to take first 2/3 (main questions) + marks + snippet of last question
    const twoThirds = result.slice(0, Math.floor(result.length * 0.65));
    
    result = twoThirds;
    if (marksContext) {
      result += "\n\n[PAPER MARKS/POINTS]\n" + marksContext + "\n";
    }
    
    // Add last ~10% (often the essay question)
    const lastBit = text.slice(-2000);
    if (lastBit.length > 500 && result.length + lastBit.length < MAX_SUBMISSION_CHARS) {
      result += "\n\n[FINAL QUESTION/ESSAY]\n" + lastBit;
    }
  }

  // Hard limit
  if (result.length > MAX_SUBMISSION_CHARS) {
    result = result.slice(0, MAX_SUBMISSION_CHARS);
    const lastNewline = result.lastIndexOf("\n");
    if (lastNewline > MAX_SUBMISSION_CHARS * 0.8) {
      result = result.slice(0, lastNewline);
    }
    result += "\n\n[...SUBMISSION TRUNCATED FOR LENGTH...]";
  }

  return result;
}

/**
 * Truncate syllabus to key sections (learning outcomes, grading criteria)
 */
function truncateSyllabus(text: string): string {
  if (text.length <= MAX_SYLLABUS_CHARS) {
    return text;
  }

  // Look for key sections: KURSMÅL, BEDÖMNING, INNEHÅL, etc.
  const keywordPatterns = [
    /KURSMÅL[\s\S]{0,2000}/,     // Learning outcomes
    /BEDÖMNING[\s\S]{0,1500}/,   // Grading criteria
    /INNEHÅL[\s\S]{0,1500}/,     // Content
  ];

  let result = "";
  for (const pattern of keywordPatterns) {
    const match = text.match(pattern);
    if (match) {
      result += match[0] + "\n\n";
      if (result.length > MAX_SYLLABUS_CHARS * 0.8) break;
    }
  }

  if (result.length === 0) {
    // Fallback: just take first part
    result = text.slice(0, MAX_SYLLABUS_CHARS);
  } else if (result.length > MAX_SYLLABUS_CHARS) {
    result = result.slice(0, MAX_SYLLABUS_CHARS);
  }

  return result + "\n[SYLLABUS TRUNCATED]";
}

/**
 * Main truncation function
 */
export function truncateTexts(
  submission: string,
  syllabus: string,
): TruncationResult {
  const originalSubmissionLen = submission.length;
  const originalSyllabusLen = syllabus.length;

  const truncatedSubmission = truncateSubmission(submission);
  const truncatedSyllabus = truncateSyllabus(syllabus);

  const truncationApplied =
    truncatedSubmission.length < submission.length ||
    truncatedSyllabus.length < syllabus.length;

  return {
    submission: truncatedSubmission,
    syllabus: truncatedSyllabus,
    truncationApplied,
    originalLengths: {
      submission: originalSubmissionLen,
      syllabus: originalSyllabusLen,
    },
  };
}
