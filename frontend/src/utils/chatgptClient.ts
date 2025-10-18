export interface QuizQuestion {
  type: 'multiple_choice' | 'short_answer';
  question: string;
  options?: string[]; // For multiple choice
  correctAnswer: string;
}

export interface QuizResponse {
  questions: QuizQuestion[];
}

export interface GradeResult {
  questionIndex: number;
  isCorrect: boolean;
  userAnswer: string;
  correctAnswer: string;
}

export interface GradeResponse {
  results: GradeResult[];
  wrongCount: number;
}

/**
 * Generate speed quiz questions using ChatGPT API
 * @param markdownContent The study material in markdown format
 * @param apiKey OpenAI API key
 * @returns Quiz questions
 */
export async function generateSpeedQuiz(
  markdownContent: string,
  apiKey: string
): Promise<QuizResponse> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '응답은 반드시 다음 JSON 형식으로만 작성해주세요:\n\n{"questions": [{"type": "multiple_choice", "question": "문제 내용", "options": ["선택지1", "선택지2", "선택지3", "선택지4"], "correctAnswer": "정답"}, {"type": "short_answer", "question": "문제 내용", "correctAnswer": "정답"}]}'
        },
        {
          role: 'user',
          content: `다음은 학습해야 할 내용입니다:\n\n${markdownContent}\n\n위 내용을 바탕으로 스피드 퀴즈 10문제를 출제해주세요. 객관식 8문제와 주관식 2문제로 구성하되, 핵심 내용을 잘 파악했는지 확인할 수 있는 문제여야 합니다.`
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`ChatGPT API 오류: ${error.error?.message || '알 수 없는 오류'}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  const quizData = JSON.parse(content);

  return quizData as QuizResponse;
}

/**
 * Grade quiz answers using ChatGPT API
 * @param quiz Quiz questions with correct answers
 * @param userAnswers User's answers
 * @param apiKey OpenAI API key
 * @returns Grading results
 */
export async function gradeQuiz(
  quiz: QuizQuestion[],
  userAnswers: Record<number, string>,
  apiKey: string
): Promise<GradeResponse> {
  const questionsWithAnswers = quiz.map((q, idx) => ({
    questionIndex: idx,
    question: q.question,
    type: q.type,
    correctAnswer: q.correctAnswer,
    userAnswer: userAnswers[idx] || ''
  }));

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '응답은 반드시 다음 JSON 형식으로만 작성해주세요:\n\n{"results": [{"questionIndex": 0, "isCorrect": true, "userAnswer": "답변", "correctAnswer": "정답"}], "wrongCount": 0}'
        },
        {
          role: 'user',
          content: `다음 퀴즈 답안을 채점해주세요. 각 문제에 대해 사용자의 답변이 정답과 일치하는지 판단해주세요. 주관식의 경우 의미가 같으면 정답으로 인정해주세요.\n\n${JSON.stringify(questionsWithAnswers, null, 2)}\n\n각 문제별로 정답 여부를 판단하고, 전체 오답 개수를 세어주세요.`
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`ChatGPT API 오류: ${error.error?.message || '알 수 없는 오류'}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  const gradeData = JSON.parse(content);

  return gradeData as GradeResponse;
}
