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
  explanation: string;
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
  // 객관식은 코드에서 직접 채점 (정확한 문자열 일치)
  const multipleChoiceResults: GradeResult[] = [];
  const shortAnswerQuestions: any[] = [];
  let wrongCount = 0;

  quiz.forEach((q, idx) => {
    const userAnswer = userAnswers[idx] || '';

    if (q.type === 'multiple_choice') {
      // 객관식: 정확한 문자열 일치로 채점
      const isCorrect = userAnswer === q.correctAnswer;
      if (!isCorrect) wrongCount++;

      multipleChoiceResults.push({
        questionIndex: idx,
        isCorrect,
        userAnswer,
        correctAnswer: q.correctAnswer,
        explanation: '' // GPT가 채울 예정
      });
    } else {
      // 주관식: GPT에게 채점 요청
      shortAnswerQuestions.push({
        questionIndex: idx,
        question: q.question,
        type: q.type,
        correctAnswer: q.correctAnswer,
        userAnswer
      });
    }
  });

  // GPT에게 해설 생성 및 주관식 채점 요청
  const questionsForGPT = [
    ...multipleChoiceResults.map((r) => {
      const q = quiz[r.questionIndex];
      return {
        questionIndex: r.questionIndex,
        question: q.question,
        type: 'multiple_choice',
        correctAnswer: r.correctAnswer,
        userAnswer: r.userAnswer,
        isCorrect: r.isCorrect // 이미 채점된 결과
      };
    }),
    ...shortAnswerQuestions
  ];

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
          content: '응답은 반드시 다음 JSON 형식으로만 작성해주세요:\n\n{"results": [{"questionIndex": 0, "isCorrect": true, "userAnswer": "답변", "correctAnswer": "정답", "explanation": "해설"}], "wrongCount": 0}'
        },
        {
          role: 'user',
          content: `다음 퀴즈 답안에 대해 해설을 작성해주세요.\n\n채점 기준:\n1. 객관식(type: "multiple_choice") 문제: isCorrect 값이 이미 제공되어 있습니다. 이 값을 그대로 사용하고 해설만 작성해주세요.\n2. 주관식(type: "short_answer") 문제: 의미가 같으면 정답으로 인정하고 isCorrect를 판단해주세요.\n\n${JSON.stringify(questionsForGPT, null, 2)}\n\n각 문제에 대한 간단한 해설(정답인 이유 또는 오답인 이유)을 포함해주세요. 주관식 문제의 오답도 세어서 전체 오답 개수를 계산해주세요.`
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

  // 주관식의 오답 개수를 추가
  const totalWrongCount = wrongCount + (gradeData.wrongCount || 0);

  return {
    results: gradeData.results,
    wrongCount: totalWrongCount
  } as GradeResponse;
}
