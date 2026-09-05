'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useLocale } from '@/lib/providers/LocaleProvider';
import {
  QuizEngine,
  type QuizQuestion,
} from '@/components/quiz/QuizEngine/QuizEngine';
import { useBestScore } from '@/components/quiz/useBestScore';
import { shuffle } from '@/components/quiz/quiz-helpers';
import type { TranslationKey } from '@/i18n/messages';

const QUIZ_LENGTH = 8;

interface GlosarioQuizTerm {
  term: string;
  transliteration: string | null;
  meaning: string;
}

function buildQuestions(
  terms: GlosarioQuizTerm[],
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
): QuizQuestion[] {
  const pool = shuffle(terms).slice(0, Math.min(QUIZ_LENGTH, terms.length));

  return pool.map((term, idx) => {
    const distractors = shuffle(terms.filter((other) => other !== term))
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
 *  preguntas armadas al vuelo desde terminos publicados (significado del
 *  término + 3 significados de otros términos como distractores). Se
 *  monta tanto en la tab "Trivia" de /glosario como, potencialmente,
 *  linkeada desde /juegos — sin duplicar la mecánica. */
interface GlosarioQuizProps {
  terms: GlosarioQuizTerm[];
}

export function GlosarioQuiz({ terms }: GlosarioQuizProps) {
  const { t } = useLocale();
  const { status: sessionStatus } = useSession();
  const [roundKey, setRoundKey] = useState(0);
  const [questions, setQuestions] = useState(() => buildQuestions(terms, t));
  const { bestScore, reportScore } = useBestScore('glosario-quiz-best-score');
  // Mejor puntaje persistido en el server (por usuario, no por dispositivo)
  // — ver /api/user/glossary-quiz-score. Si no hay sesión, queda en null y
  // el mejor puntaje mostrado/usado es el de localStorage de siempre.
  const [serverBest, setServerBest] = useState<number | null>(null);

  useEffect(() => {
    if (sessionStatus !== 'authenticated') return;
    let cancelled = false;
    fetch('/api/user/glossary-quiz-score')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { glossaryQuizBestScore: number | null } | null) => {
        if (!cancelled && data) setServerBest(data.glossaryQuizBestScore);
      })
      .catch(() => {
        // sin conexión / error puntual — sigue funcionando con localStorage
      });
    return () => {
      cancelled = true;
    };
  }, [sessionStatus]);

  const effectiveBest =
    bestScore === null && serverBest === null
      ? null
      : Math.max(bestScore ?? 0, serverBest ?? 0);

  return (
    <QuizEngine
      key={roundKey}
      questions={questions}
      bestScore={effectiveBest}
      onFinish={(score) => {
        reportScore(score);
        if (sessionStatus !== 'authenticated') return;
        fetch('/api/user/glossary-quiz-score', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ score }),
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data: { glossaryQuizBestScore: number } | null) => {
            if (data) setServerBest(data.glossaryQuizBestScore);
          })
          .catch(() => {
            // sin conexión / error puntual — el score local ya quedó guardado
          });
      }}
      onRestart={() => {
        setQuestions(buildQuestions(terms, t));
        setRoundKey((key) => key + 1);
      }}
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
