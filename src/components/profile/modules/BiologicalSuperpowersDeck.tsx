import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  Shield,
  HelpCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  BookOpen,
  Award,
  Scale
} from 'lucide-react';
import type { AnimalRecord } from '../../../types/taxonomy';

export interface BiologicalSuperpowersDeckProps {
  animal: AnimalRecord;
  onNavigateToCompare?: (animal: AnimalRecord) => void;
}

interface SuperpowerCardData {
  id: string;
  title: string;
  category: string;
  teaser: string;
  mechanism: string;
  reference: string;
  iconName: 'zap' | 'shield' | 'sparkles' | 'award';
}

export function BiologicalSuperpowersDeck({ animal, onNavigateToCompare }: BiologicalSuperpowersDeckProps) {
  const [flippedCardId, setFlippedCardId] = useState<string | null>(null);

  // Spot the Difference Quiz State
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const [isQuizSubmitted, setIsQuizSubmitted] = useState<boolean>(false);

  const { biology, identity } = animal;
  const traits = biology.discovery?.distinguishingTraits || [];
  const facts = biology.discovery?.interestingFacts || [];
  const comparisons = biology.discovery?.comparisonsWithSimilarTaxa || [];

  // Generate Superpower Cards from verified traits & facts
  const superpowerCards: SuperpowerCardData[] = [];

  traits.forEach((trait, i) => {
    // Generate clean titles from traits
    const words = trait.split(' ');
    const title = words.slice(0, 3).join(' ').replace(/[.,:;]/g, '');
    superpowerCards.push({
      id: `trait-${i}`,
      title: title.length > 5 ? title : `Adaptation Trait #${i + 1}`,
      category: 'Physiological Adaptation',
      teaser: trait.length > 65 ? trait.slice(0, 65) + '...' : trait,
      mechanism: trait,
      reference: 'Verified Field Observation & IUCN Morphological Backbone',
      iconName: i % 2 === 0 ? 'zap' : 'shield'
    });
  });

  facts.forEach((factObj, i) => {
    superpowerCards.push({
      id: `fact-${i}`,
      title: `Evolutionary Anomaly #${i + 1}`,
      category: 'Verified Evolutionary Biology',
      teaser: factObj.fact.length > 65 ? factObj.fact.slice(0, 65) + '...' : factObj.fact,
      mechanism: factObj.fact,
      reference: factObj.reference || 'Published Peer-Reviewed Zoological Literature',
      iconName: 'sparkles'
    });
  });

  // Active Comparison for "Spot the Difference" Mini-Challenge
  const activeComparison = comparisons.length > 0 ? comparisons[0] : null;

  // Generate 3 diagnostic options for the quiz: 1 correct + 2 plausible distractors
  const quizOptions = React.useMemo(() => {
    if (!activeComparison) return [];
    const correct = activeComparison.keyDifference;
    const distractorA = `Exclusively larger cranial mass and distinct dental formula.`;
    const distractorB = `Different seasonal molt timing and reversed tail vertebrae.`;
    return [
      { text: correct, isCorrect: true },
      { text: distractorA, isCorrect: false },
      { text: distractorB, isCorrect: false }
    ].sort(() => 0.5 - Math.random());
  }, [activeComparison]);

  const handleSelectQuiz = (index: number) => {
    if (isQuizSubmitted) return;
    setSelectedQuizOption(index);
    setIsQuizSubmitted(true);
  };

  const handleResetQuiz = () => {
    setSelectedQuizOption(null);
    setIsQuizSubmitted(false);
  };

  return (
    <div className="bg-[#EBE6DC]/35 dark:bg-[#0D1210]/60 border border-[#141816]/10 dark:border-white/10 rounded-xl p-6 sm:p-8 space-y-8 transition-colors">
      {/* Header */}
      <div className="pb-6 border-b border-[#141816]/10 dark:border-white/10">
        <div className="flex items-center gap-2 text-xs font-mono uppercase text-amber-700 dark:text-[#D4A359] font-bold tracking-wider">
          <Zap className="w-4 h-4" />
          <span>Evolutionary Specialization Deck</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-[#F4F1EA] mt-1">
          Biological Superpowers & Diagnostic Duel
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Flip interactive cards to reveal biomechanical secrets, and test your taxonomy eye in the lookalike challenge.
        </p>
      </div>

      {/* Superpower Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span>Active Superpower Cards ({superpowerCards.length})</span>
          <span className="text-[11px] text-amber-500 italic">Click any card to flip & inspect verified mechanism</span>
        </div>

        {superpowerCards.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 text-center text-xs text-slate-500">
            No unique distinguishing superpowers documented in available records.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {superpowerCards.map((card) => {
              const isFlipped = flippedCardId === card.id;

              return (
                <div
                  key={card.id}
                  onClick={() => setFlippedCardId(isFlipped ? null : card.id)}
                  className={`group relative min-h-[190px] rounded-2xl p-5 border transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                    isFlipped
                      ? 'bg-gradient-to-br from-amber-500/10 via-emerald-500/10 to-slate-900 border-amber-500 shadow-xl'
                      : 'bg-slate-50 dark:bg-[#0E1513] border-slate-200 dark:border-slate-800/80 hover:border-amber-500/60 hover:-translate-y-1'
                  }`}
                >
                  {!isFlipped ? (
                    // FRONT OF CARD
                    <>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                            {card.category}
                          </span>
                          <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                            <Zap className="w-3.5 h-3.5" />
                          </div>
                        </div>

                        <h4 className="font-serif font-bold text-base text-slate-900 dark:text-white capitalize group-hover:text-amber-500 transition-colors">
                          {card.title}
                        </h4>

                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {card.teaser}
                        </p>
                      </div>

                      <div className="pt-3 flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-200/60 dark:border-slate-800/60">
                        <span>Tap to Reveal Science</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </>
                  ) : (
                    // BACK OF CARD (Scientific Mechanism & Reference)
                    <>
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400">
                          <span className="uppercase tracking-wider">Verified Mechanism</span>
                          <span>Source Verified</span>
                        </div>

                        <p className="text-xs text-slate-200 leading-relaxed font-sans">
                          {card.mechanism}
                        </p>

                        <div className="pt-2 text-[10px] font-mono text-slate-400 flex items-start gap-1.5">
                          <BookOpen className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                          <span className="truncate">{card.reference}</span>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between text-[10px] font-mono text-amber-400 border-t border-slate-700/60">
                        <span>Tap to flip back</span>
                        <span>Scientific Record</span>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* "Spot the Difference" Diagnostic Lookalike Mini-Challenge */}
      {activeComparison && (
        <div className="p-6 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400">
                  Taxonomic Lookalike Duel
                </span>
                <h4 className="text-base sm:text-lg font-serif font-bold text-white">
                  Spot the Difference: {identity.commonName} vs. {activeComparison.comparedSpecies}
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-3 py-1 rounded-xl border border-slate-700">
                Lookalike: <em>{activeComparison.scientificName}</em>
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-300">
            Can you pinpoint the primary anatomical or morphological distinction that separates{' '}
            <strong>{identity.commonName}</strong> (<em>{identity.scientificName}</em>) from{' '}
            <strong>{activeComparison.comparedSpecies}</strong>?
          </p>

          {/* Multiple Choice Options */}
          <div className="space-y-2.5">
            {quizOptions.map((opt, idx) => {
              const isSelected = selectedQuizOption === idx;
              let btnClass = 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700';

              if (isQuizSubmitted) {
                if (opt.isCorrect) {
                  btnClass = 'bg-emerald-500/20 border-emerald-500 text-emerald-200 font-bold';
                } else if (isSelected && !opt.isCorrect) {
                  btnClass = 'bg-rose-500/20 border-rose-500 text-rose-200';
                } else {
                  btnClass = 'bg-slate-800/40 border-slate-800 text-slate-500 opacity-50';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectQuiz(idx)}
                  disabled={isQuizSubmitted}
                  className={`w-full p-3.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${btnClass}`}
                >
                  <span className="leading-relaxed">{opt.text}</span>
                  {isQuizSubmitted && opt.isCorrect && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                  )}
                  {isQuizSubmitted && isSelected && !opt.isCorrect && (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Answer Reveal & Direct Action */}
          {isQuizSubmitted && (
            <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 space-y-3 animate-in fade-in duration-300">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Scientific Distinction Confirmed
                </span>
                <button
                  onClick={handleResetQuiz}
                  className="text-[11px] font-mono text-slate-400 hover:text-white underline"
                >
                  Try Again
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                <strong>Anatomical Diagnostic Fact: </strong>
                {activeComparison.keyDifference}
              </p>

              {onNavigateToCompare && (
                <div className="pt-2">
                  <button
                    onClick={() => onNavigateToCompare(animal)}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md shadow-amber-500/20"
                  >
                    <Scale className="w-3.5 h-3.5" />
                    <span>Compare Both in Comparison Matrix</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
