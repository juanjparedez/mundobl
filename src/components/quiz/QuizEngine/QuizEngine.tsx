'use client';

import { useState } from 'react';
import { Button } from 'antd';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  TrophyFilled,
} from '@ant-design/icons';
import { PanelCard } from '@/components/design-system/PanelCard/PanelCard';
import './QuizEngine.css';

export interface QuizQuestion {
  id: string;
  prompt: string;
  /** 4 opciones, ya shuffleadas por el caller. */
  options: string[];
  correctIndex: number;
}

export interface QuizEngineLabels {
  questionCounter: (current: number, total: number) => string;
  scoreLabel: (score: number, total: number) => string;
  correctFeedback: string;
  incorrectFeedbackPrefix: string;
  nextButton: string;
  finishButton: string;
  finishTitle: string;
  playAgainButton: string;
  bestScoreLabel?: (score: number, total: number) => string;
}

export interface QuizEngineProps {
  /** Preguntas ya armadas por el caller (contenido + shuffle de opciones). */
  questions: QuizQuestion[];
  /** Todo el texto de UI, ya resuelto — el motor no sabe nada de i18n. */
  labels: QuizEngineLabels;
  /** El caller arma un set nuevo de preguntas y remonta este componente
   *  (via `key`) — el motor no tiene lógica de reset propia. */
  onRestart: () => void;
  /** Mejor puntaje ya persistido por el caller (via useBestScore). */
  bestScore?: number | null;
  /** Se llama una vez al terminar la ronda, para que el caller actualice
   *  el mejor puntaje. */
  onFinish?: (score: number, total: number) => void;
}

/** Motor de trivia genérico: opción múltiple, feedback inmediato, puntaje
 *  final + reinicio. No conoce el contenido de las preguntas ni el idioma
 *  — los arma el caller (GlosarioQuiz, SeriesTrivia). Reusado en vez de
 *  duplicar la mecánica en cada trivia (mismo criterio que
 *  useReorderablePrefs/ReorderConfigDrawer para /catalogo + /ver). */
export function QuizEngine({
  questions,
  labels,
  onRestart,
  bestScore,
  onFinish,
}: QuizEngineProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  if (questions.length === 0) return null;

  const question = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;

  const handleSelect = (optionIndex: number) => {
    if (selected !== null) return;
    setSelected(optionIndex);
    if (optionIndex === question.correctIndex) {
      setScore((s) => s + 1);
    }
  };

  const handleAdvance = () => {
    if (isLast) {
      setFinished(true);
      onFinish?.(score, questions.length);
      return;
    }
    setCurrentIndex((i) => i + 1);
    setSelected(null);
  };

  if (finished) {
    return (
      <PanelCard className="quiz-engine quiz-engine--finished">
        <TrophyFilled className="quiz-engine__trophy" />
        <h3 className="quiz-engine__finish-title">{labels.finishTitle}</h3>
        <p className="quiz-engine__score">
          {labels.scoreLabel(score, questions.length)}
        </p>
        {typeof bestScore === 'number' && labels.bestScoreLabel && (
          <p className="quiz-engine__best-score">
            {labels.bestScoreLabel(bestScore, questions.length)}
          </p>
        )}
        <Button type="primary" onClick={onRestart}>
          {labels.playAgainButton}
        </Button>
      </PanelCard>
    );
  }

  return (
    <PanelCard className="quiz-engine">
      <div className="quiz-engine__header">
        <span className="quiz-engine__counter">
          {labels.questionCounter(currentIndex + 1, questions.length)}
        </span>
      </div>

      <p className="quiz-engine__prompt">{question.prompt}</p>

      <div className="quiz-engine__options">
        {question.options.map((option, idx) => {
          const isCorrect = idx === question.correctIndex;
          const isSelected = idx === selected;
          const revealed = selected !== null;
          const classes = [
            'quiz-engine__option',
            revealed && isCorrect ? 'quiz-engine__option--correct' : '',
            revealed && isSelected && !isCorrect
              ? 'quiz-engine__option--incorrect'
              : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <button
              key={idx}
              type="button"
              className={classes}
              disabled={revealed}
              onClick={() => handleSelect(idx)}
            >
              {revealed && isCorrect && <CheckCircleFilled />}
              {revealed && isSelected && !isCorrect && <CloseCircleFilled />}
              <span>{option}</span>
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <div className="quiz-engine__feedback">
          {selected === question.correctIndex ? (
            <span className="quiz-engine__feedback-text quiz-engine__feedback-text--correct">
              {labels.correctFeedback}
            </span>
          ) : (
            <span className="quiz-engine__feedback-text quiz-engine__feedback-text--incorrect">
              {labels.incorrectFeedbackPrefix}{' '}
              {question.options[question.correctIndex]}
            </span>
          )}
          <Button type="primary" onClick={handleAdvance}>
            {isLast ? labels.finishButton : labels.nextButton}
          </Button>
        </div>
      )}
    </PanelCard>
  );
}
