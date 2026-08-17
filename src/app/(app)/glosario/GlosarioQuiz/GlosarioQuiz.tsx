'use client';

import { useMemo, useState } from 'react';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { CULTURAL_GLOSSARY } from '@/data/cultural-glossary';
import {
  QuizEngine,
  type QuizQuestion,
} from '@/components/quiz/QuizEngine/QuizEngine';
import { useBestScore } from '@/components/quiz/useBestScore';
import { shuffle } from '@/components/quiz/quiz-helpers';
import type { TranslationKey } from '@/i18n/messages';

const QUIZ_LENGTH = 8;

function buildQuestions(
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
): QuizQuestion[] {
  const pool = shuffle(CULTURAL_GLOSSARY).slice(
    0,
    Math.min(QUIZ_LENGTH, CULTURAL_GLOSSARY.length)
  );

  return pool.map((term, idx) => {
    const distractors = shuffle(
      CULTURAL_GLOSSARY.filter((other) => other !== term)
    )
      .slice(0, 3)
      .map((other) => other.meaning);
    const options = shuffle([term.meaning, ...distractors]);

    return {
      id: `${term.term}-${idx}`,
      prompt: t('glosarioQuiz.promptTemplate', {
        term: term.transliteration ?? term.term,
      }),
      options,
      correctIndex: options.indexOf(term.meaning),
    };
  });
}

/** Mini-trivia del Glosario: reusa el motor genérico QuizEngine con
 *  preguntas armadas al vuelo desde CULTURAL_GLOSSARY (significado del
 *  término + 3 significados de otros términos como distractores). Se
 *  monta tanto en la tab "Trivia" de /glosario como, potencialmente,
 *  linkeada desde /juegos — sin duplicar la mecánica. */
export function GlosarioQuiz() {
  const { t } = useLocale();
  const [roundKey, setRoundKey] = useState(0);
  const { bestScore, reportScore } = useBestScore('glosario-quiz-best-score');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const questions = useMemo(() => buildQuestions(t), [roundKey]);

  return (
    <QuizEngine
      key={roundKey}
      questions={questions}
      bestScore={bestScore}
      onFinish={(score) => reportScore(score)}
      onRestart={() => setRoundKey((k) => k + 1)}
      labels={{
        questionCounter: (current, total) =>
          t('glosarioQuiz.questionCounter', { current, total }),
        scoreLabel: (score, total) =>
          t('glosarioQuiz.scoreLabel', { score, total }),
        correctFeedback: t('glosarioQuiz.correctFeedback'),
        incorrectFeedbackPrefix: t('glosarioQuiz.incorrectFeedbackPrefix'),
        nextButton: t('glosarioQuiz.nextButton'),
        finishButton: t('glosarioQuiz.finishButton'),
        finishTitle: t('glosarioQuiz.finishTitle'),
        playAgainButton: t('glosarioQuiz.playAgainButton'),
        bestScoreLabel: (score, total) =>
          t('glosarioQuiz.bestScoreLabel', { score, total }),
      }}
    />
  );
}
