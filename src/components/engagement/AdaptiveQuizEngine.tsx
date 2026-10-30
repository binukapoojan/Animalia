import React, { useState, useEffect, useMemo } from 'react';
import {
  BrainCircuit,
  Eye,
  GitBranch,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RefreshCw,
  Award,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { AnimalRecord, QuizMode, QuizQuestion } from '../../types/taxonomy';
import { repository } from '../../services/supabaseRepository';
import { TaxonomicSilhouette } from '../common/TaxonomicSilhouette';

interface AdaptiveQuizEngineProps {
  animals: AnimalRecord[];
  onSelectAnimal: (animal: AnimalRecord) => void;
}

export function AdaptiveQuizEngine({ animals, onSelectAnimal }: AdaptiveQuizEngineProps) {
  const [quizMode, setQuizMode] = useState<QuizMode>('VISUAL_IDENTIFICATION');
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  // Generate a question based on current mode
  const generateQuestion = (mode: QuizMode): QuizQuestion | null => {
    if (!animals || animals.length < 4) return null;

    // Filter animals suitable for the mode
    let eligible = animals;
    if (mode === 'VISUAL_IDENTIFICATION') {
      eligible = animals.filter((a) => Boolean(a.media?.url));
    }

    if (eligible.length < 4) eligible = animals;

    // Pick 1 target randomly
    const targetIdx = Math.floor(Math.random() * eligible.length);
    const target = eligible[targetIdx];

    // Pick 3 distractors
    const otherCandidates = animals.filter((a) => a.id !== target.id);
    const shuffled = [...otherCandidates].sort(() => 0.5 - Math.random());
    const distractors = shuffled.slice(0, 3);

    const questionId = `q-${Date.now()}`;

    if (mode === 'VISUAL_IDENTIFICATION') {
      const options = [
        { id: target.id, label: target.identity.commonName, sublabel: target.identity.scientificName, isCorrect: true },
        ...distractors.map((d) => ({
          id: d.id,
          label: d.identity.commonName,
          sublabel: d.identity.scientificName,
          isCorrect: false
        }))
      ].sort(() => 0.5 - Math.random());

      return {
        id: questionId,
        mode,
        targetTaxon: target,
        prompt: 'Identify this species from its verified wildlife observation photograph:',
        options,
        explanation: `${target.identity.commonName} (${target.identity.scientificName}) is classified under ${target.identity.categoryGroup} (${target.identity.lineage?.family || 'Family'}). Photo attribution: ${target.media.attribution || 'Wikimedia'}.`
      };
    } else if (mode === 'CLADE_CLASSIFICATION') {
      const targetClade = target.identity.lineage?.order || target.identity.lineage?.class || target.identity.categoryGroup;
      
      const distractorClades = Array.from(
        new Set(
          distractors.map((d) => d.identity.lineage?.order || d.identity.lineage?.class || d.identity.categoryGroup).filter(c => Boolean(c) && c !== targetClade)
        )
      );

      // Ensure we have 3 unique distractors
      const fallbackClades = ['Carnivora', 'Cetacea', 'Artiodactyla', 'Passeriformes', 'Squamata', 'Anura', 'Decapoda', 'Hymenoptera']
        .filter(c => c !== targetClade && !distractorClades.includes(c));
      while (distractorClades.length < 3 && fallbackClades.length > 0) {
        distractorClades.push(fallbackClades.pop()!);
      }

      const options = [
        { id: 'correct', label: `Order ${targetClade}`, isCorrect: true },
        ...distractorClades.slice(0, 3).map((c, idx) => ({
          id: `dist-${idx}`,
          label: `Order ${c}`,
          isCorrect: false
        }))
      ].sort(() => 0.5 - Math.random());

      return {
        id: questionId,
        mode,
        targetTaxon: target,
        prompt: `To which taxonomic order does the ${target.identity.commonName} (${target.identity.scientificName}) belong?`,
        options,
        explanation: `The ${target.identity.commonName} belongs to Order ${targetClade} within ${target.identity.lineage?.class || 'its taxonomic class'}.`
      };
    } else {
      // CONSERVATION_STATUS
      const targetIucn = target.biology.conservation?.iucnStatus || 'LC';
      const allStatuses = ['CR', 'EN', 'VU', 'LC', 'NT', 'EX'].filter(s => s !== targetIucn);
      const shuffledStatuses = [...allStatuses].sort(() => 0.5 - Math.random()).slice(0, 3);

      const statusLabels: Record<string, string> = {
        CR: 'Critically Endangered (CR)',
        EN: 'Endangered (EN)',
        VU: 'Vulnerable (VU)',
        NT: 'Near Threatened (NT)',
        LC: 'Least Concern (LC)',
        EX: 'Extinct (EX)',
        NE: 'Not Evaluated (NE)'
      };

      const options = [
        { id: targetIucn, label: statusLabels[targetIucn] || targetIucn, isCorrect: true },
        ...shuffledStatuses.map((s) => ({
          id: s,
          label: statusLabels[s] || s,
          isCorrect: false
        }))
      ].sort(() => 0.5 - Math.random());

      return {
        id: questionId,
        mode,
        targetTaxon: target,
        prompt: `What is the official IUCN Red List conservation status of the ${target.identity.commonName}?`,
        options,
        explanation: `According to the IUCN Red List, the ${target.identity.commonName} (${target.identity.scientificName}) is assessed as ${statusLabels[targetIucn] || targetIucn}.`
      };
    }
  };

  // Initialize or re-generate question on mode switch
  useEffect(() => {
    setCurrentQuestion(generateQuestion(quizMode));
    setSelectedOptionId(null);
    setIsAnswered(false);
  }, [quizMode, animals]);

  const handleSelectOption = async (optionId: string, isCorrect: boolean) => {
    if (isAnswered || !currentQuestion) return;
    setSelectedOptionId(optionId);
    setIsAnswered(true);

    setScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1
    }));

    // Record attempt via repository
    try {
      await repository.recordQuizAttempt({
        quiz_mode: currentQuestion.mode,
        taxon_id: currentQuestion.targetTaxon.id,
        is_correct: isCorrect
      });
    } catch (err) {
      console.warn('Could not persist quiz attempt:', err);
    }
  };

  const handleNextQuestion = () => {
    setCurrentQuestion(generateQuestion(quizMode));
    setSelectedOptionId(null);
    setIsAnswered(false);
  };

  const modes: { id: QuizMode; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'VISUAL_IDENTIFICATION',
      label: 'Visual Identification',
      icon: <Eye className="w-4 h-4" />,
      desc: 'Identify species from real CC-licensed wildlife photography'
    },
    {
      id: 'CLADE_CLASSIFICATION',
      label: 'Clade Classification',
      icon: <GitBranch className="w-4 h-4" />,
      desc: 'Classify organisms into correct taxonomic orders and classes'
    },
    {
      id: 'CONSERVATION_STATUS',
      label: 'Conservation & Ecology',
      icon: <ShieldAlert className="w-4 h-4" />,
      desc: 'Test knowledge on IUCN Red List threat statuses'
    }
  ];

  return (
    <section className="space-y-6">
      {/* Mode Selector Header */}
      <div className="bg-white dark:bg-[#121917] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono text-xs font-semibold mb-2">
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>ADAPTIVE BIODIVERSITY QUIZ ENGINE</span>
          </div>
          <h2 className="text-2xl font-serif font-bold">Naturalist Skill Assessment</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Questions generated dynamically in real time from verified records in the taxonomic backbone.
          </p>
        </div>

        {/* Score pill */}
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-[#0B0F0E] p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Award className="w-5 h-5 text-amber-500" />
          <div className="text-xs">
            <span className="font-mono text-slate-400 block">SESSION SCORE</span>
            <span className="font-bold text-sm">
              {score.correct} / {score.total}{' '}
              {score.total > 0 && (
                <span className="text-slate-400 font-normal">
                  ({Math.round((score.correct / score.total) * 100)}%)
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Mode Switch Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {modes.map((m) => {
          const isActive = quizMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setQuizMode(m.id)}
              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 ${
                isActive
                  ? 'bg-amber-500/15 border-amber-500 text-slate-900 dark:text-white shadow-md'
                  : 'bg-white dark:bg-[#121917] border-slate-200 dark:border-slate-800 hover:border-amber-500/40 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold text-sm">
                <span className={isActive ? 'text-amber-500' : 'text-slate-400'}>{m.icon}</span>
                <span>{m.label}</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{m.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Active Question Card */}
      {currentQuestion ? (
        <div className="bg-white dark:bg-[#121917] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase text-amber-600 dark:text-amber-400 font-semibold tracking-wider">
              {modes.find((m) => m.id === currentQuestion.mode)?.label}
            </span>
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-slate-100">
              {currentQuestion.prompt}
            </h3>
          </div>

          {/* Visual Mode Photo Frame */}
          {currentQuestion.mode === 'VISUAL_IDENTIFICATION' && (
            <div className="relative aspect-[16/9] sm:aspect-[21/9] max-h-80 w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-800">
              {currentQuestion.targetTaxon.media?.url ? (
                <img
                  src={currentQuestion.targetTaxon.media.url}
                  alt="Species to identify"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
              ) : (
                <TaxonomicSilhouette
                  categoryGroup={currentQuestion.targetTaxon.identity.categoryGroup}
                  scientificName={currentQuestion.targetTaxon.identity.scientificName}
                />
              )}
              <div className="absolute bottom-2 right-3 text-[10px] font-mono bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-white/80">
                License: {currentQuestion.targetTaxon.media.licenseCode || 'CC'}
              </div>
            </div>
          )}

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentQuestion.options.map((opt) => {
              const isSelected = selectedOptionId === opt.id;
              let btnClass = 'bg-slate-50 dark:bg-[#0B0F0E] border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-amber-500/60';

              if (isAnswered) {
                if (opt.isCorrect) {
                  btnClass = 'bg-emerald-500/15 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-semibold';
                } else if (isSelected) {
                  btnClass = 'bg-rose-500/15 border-rose-500 text-rose-800 dark:text-rose-200';
                } else {
                  btnClass = 'opacity-40 border-slate-200 dark:border-slate-800';
                }
              }

              return (
                <button
                  key={opt.id}
                  disabled={isAnswered}
                  onClick={() => handleSelectOption(opt.id, opt.isCorrect)}
                  className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 ${btnClass}`}
                >
                  <div>
                    <div className="text-sm font-semibold">{opt.label}</div>
                    {opt.sublabel && (
                      <div className="text-xs font-serif italic text-slate-500 dark:text-slate-400">
                        {opt.sublabel}
                      </div>
                    )}
                  </div>
                  {isAnswered && (
                    <div>
                      {opt.isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                      {isSelected && !opt.isCorrect && <XCircle className="w-5 h-5 text-rose-500 shrink-0" />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Feedback & Explanation Box */}
          {isAnswered && (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-[#0B0F0E] border border-slate-200 dark:border-slate-800 space-y-3 animate-fade-in">
              <div className="flex items-center gap-2">
                {selectedOptionId && currentQuestion.options.find((o) => o.id === selectedOptionId)?.isCorrect ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" /> CORRECT!
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                    <XCircle className="w-4 h-4" /> INCORRECT
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-serif">
                {currentQuestion.explanation}
              </p>
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => onSelectAnimal(currentQuestion.targetTaxon)}
                  className="text-xs font-mono text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                >
                  <span>Open Full Specimen Profile</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
                <button
                  onClick={handleNextQuestion}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs sm:text-sm flex items-center gap-2 shadow"
                >
                  <span>Next Challenge</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-[#121917] border border-slate-200 dark:border-slate-800 rounded-3xl">
          <RefreshCw className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
          <p className="text-sm text-slate-500 mt-2">Generating adaptive question from biodiversity backbone...</p>
        </div>
      )}
    </section>
  );
}
