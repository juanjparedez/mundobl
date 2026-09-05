'use client';

import {
  CompassFilled,
  ReadFilled,
  HeartFilled,
  StarFilled,
  CommentOutlined,
  FireFilled,
  ClockCircleFilled,
  ThunderboltFilled,
  CrownFilled,
  CheckCircleFilled,
  BookFilled,
  BulbFilled,
} from '@ant-design/icons';
import type { ProfileData } from '../../types';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import { AutoFitList } from '@/components/design-system';
import './Achievements.css';

// Cantidad de preguntas de la trivia del Glosario Cultural — debe
// mantenerse igual a QUIZ_LENGTH en GlosarioQuiz.tsx. No se importa desde
// ahí a propósito: ese archivo es un client component de la feature
// /glosario con sus propias dependencias (QuizEngine, useSession, etc.)
// que no tiene sentido arrastrar a /perfil solo por una constante.
const GLOSSARY_QUIZ_LENGTH = 8;

interface Props {
  stats: ProfileData['stats'];
}

interface Achievement {
  key: string;
  icon: React.ReactNode;
  name: string;
  description: string;
  /** Progreso actual hacia la meta (current / goal). */
  current: number;
  goal: number;
  tone: 'gold' | 'purple' | 'red' | 'blue' | 'green';
}

/** Numero total de achievements definidos. Util para el contador
 *  unlocked/total que aparece en el header del widget (sin necesidad
 *  de instanciar todas las traducciones). */
export const ACHIEVEMENTS_TOTAL = 15;

/** Cuenta cuantos achievements estan unlocked con un set de stats dado.
 *  Espejo de la logica `current >= goal` del array interno — se exporta
 *  para que AchievementsWidget pueda renderizar el contador como Widget
 *  action sin re-instanciar todo el array de achievements. */
export function countUnlockedAchievements(stats: ProfileData['stats']): number {
  const goals: { current: number; goal: number }[] = [
    { current: stats.watched, goal: 1 }, // first-step
    { current: stats.watched, goal: 10 }, // starter
    { current: stats.watched, goal: 50 }, // explorer
    { current: stats.watched, goal: 100 }, // completionist
    { current: stats.reviews, goal: 1 }, // first-review
    { current: stats.reviews, goal: 10 }, // critic
    { current: stats.comments, goal: 50 }, // voice
    { current: stats.ratings, goal: 25 }, // rater
    { current: stats.favorites, goal: 25 }, // fan
    { current: Math.floor(stats.hoursWatched), goal: 100 }, // binger
    { current: stats.longestStreak, goal: 7 }, // streak-7
    { current: stats.longestStreak, goal: 30 }, // streak-30
    { current: stats.approvedGlossaryTerms, goal: 1 }, // glossary-contributor
    { current: stats.approvedGlossaryTerms, goal: 5 }, // glossary-scholar
    { current: stats.glossaryQuizBestScore ?? 0, goal: GLOSSARY_QUIZ_LENGTH }, // trivia-master
  ];
  return goals.filter((g) => g.current >= g.goal).length;
}

/** "Logros y hitos". Logros derivados de stats reales — sin modelo
 *  Achievement en DB todavia. Cada logro tiene meta clara, current/goal,
 *  y se separan visualmente entre obtenidos y pendientes. Cuando exista
 *  modelo Achievement en backend se reemplaza esta lista por la real. */
export function OverviewAchievements({ stats }: Props) {
  const { t } = useLocale();

  const achievements: Achievement[] = [
    {
      key: 'first-step',
      icon: <CheckCircleFilled />,
      name: t('achievements.firstStepName'),
      description: t('achievements.firstStepDesc'),
      current: stats.watched,
      goal: 1,
      tone: 'green',
    },
    {
      key: 'starter',
      icon: <CompassFilled />,
      name: t('achievements.starterName'),
      description: t('achievements.starterDesc'),
      current: stats.watched,
      goal: 10,
      tone: 'green',
    },
    {
      key: 'explorer',
      icon: <CompassFilled />,
      name: t('achievements.explorerName'),
      description: t('achievements.explorerDesc'),
      current: stats.watched,
      goal: 50,
      tone: 'gold',
    },
    {
      key: 'completionist',
      icon: <CrownFilled />,
      name: t('achievements.completionistName'),
      description: t('achievements.completionistDesc'),
      current: stats.watched,
      goal: 100,
      tone: 'gold',
    },
    {
      key: 'first-review',
      icon: <ReadFilled />,
      name: t('achievements.firstReviewName'),
      description: t('achievements.firstReviewDesc'),
      current: stats.reviews,
      goal: 1,
      tone: 'green',
    },
    {
      key: 'critic',
      icon: <ReadFilled />,
      name: t('achievements.criticName'),
      description: t('achievements.criticDesc'),
      current: stats.reviews,
      goal: 10,
      tone: 'purple',
    },
    {
      key: 'voice',
      icon: <CommentOutlined />,
      name: t('achievements.voiceName'),
      description: t('achievements.voiceDesc'),
      current: stats.comments,
      goal: 50,
      tone: 'blue',
    },
    {
      key: 'rater',
      icon: <StarFilled />,
      name: t('achievements.raterName'),
      description: t('achievements.raterDesc'),
      current: stats.ratings,
      goal: 25,
      tone: 'gold',
    },
    {
      key: 'fan',
      icon: <HeartFilled />,
      name: t('achievements.fanName'),
      description: t('achievements.fanDesc'),
      current: stats.favorites,
      goal: 25,
      tone: 'red',
    },
    {
      key: 'binger',
      icon: <ClockCircleFilled />,
      name: t('achievements.bingerName'),
      description: t('achievements.bingerDesc'),
      current: Math.floor(stats.hoursWatched),
      goal: 100,
      tone: 'purple',
    },
    {
      key: 'streak-7',
      icon: <FireFilled />,
      name: t('achievements.streak7Name'),
      description: t('achievements.streak7Desc'),
      current: stats.longestStreak,
      goal: 7,
      tone: 'red',
    },
    {
      key: 'streak-30',
      icon: <ThunderboltFilled />,
      name: t('achievements.streak30Name'),
      description: t('achievements.streak30Desc'),
      current: stats.longestStreak,
      goal: 30,
      tone: 'gold',
    },
    {
      key: 'glossary-contributor',
      icon: <BookFilled />,
      name: t('achievements.glossaryContributorName'),
      description: t('achievements.glossaryContributorDesc'),
      current: stats.approvedGlossaryTerms,
      goal: 1,
      tone: 'blue',
    },
    {
      key: 'glossary-scholar',
      icon: <BookFilled />,
      name: t('achievements.glossaryScholarName'),
      description: t('achievements.glossaryScholarDesc'),
      current: stats.approvedGlossaryTerms,
      goal: 5,
      tone: 'purple',
    },
    {
      key: 'trivia-master',
      icon: <BulbFilled />,
      name: t('achievements.triviaMasterName'),
      description: t('achievements.triviaMasterDesc'),
      current: stats.glossaryQuizBestScore ?? 0,
      goal: GLOSSARY_QUIZ_LENGTH,
      tone: 'gold',
    },
  ];

  // Prioridad: obtenidos primero, pendientes despues — tanto colapsado
  // como expandido (AutoFitList corta la cola que no entra).
  const unlocked = achievements.filter((a) => a.current >= a.goal);
  const pending = achievements.filter((a) => a.current < a.goal);
  const ordered = [...unlocked, ...pending];

  // Header (title + counter) lo provee el Widget wrapper. Esta section
  // solo rendea el body (lista de achievements + toggle). AutoFitList mide
  // cuantos items entran realmente en el alto disponible del widget en vez
  // de asumir un conteo fijo — evita que la lista quede cortada si el
  // calculo manual de altura del grid se desincroniza.
  return (
    <section className="overview-achievements">
      <AutoFitList
        as="ul"
        collapsedCount={4}
        listClassName="overview-achievements__list"
        wrapClassName="overview-achievements__wrap"
        viewLessLabel={t('profile.overviewViewLess')}
        viewMoreLabel={(count) =>
          interpolateMessage(t('profile.overviewViewAllCount'), {
            count: String(count),
          })
        }
      >
        {ordered.map((a) => {
          const isUnlocked = a.current >= a.goal;
          const pct = Math.min(100, Math.round((a.current / a.goal) * 100));
          return (
            <li
              key={a.key}
              className={`overview-achievements__item overview-achievements__item--${a.tone}${isUnlocked ? '' : ' overview-achievements__item--locked'}`}
            >
              <span className="overview-achievements__icon" aria-hidden>
                {a.icon}
              </span>
              <div className="overview-achievements__body">
                <div className="overview-achievements__row">
                  <span className="overview-achievements__name">{a.name}</span>
                  <span className="overview-achievements__progress-text">
                    {Math.min(a.current, a.goal)} / {a.goal}
                  </span>
                </div>
                <span className="overview-achievements__desc">
                  {a.description}
                </span>
                {!isUnlocked && (
                  <div className="overview-achievements__bar-track">
                    <div
                      className="overview-achievements__bar-fill"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </AutoFitList>
    </section>
  );
}
