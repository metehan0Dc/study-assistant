'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, CheckCircle, XCircle, Trophy, BookOpen, GraduationCap } from "lucide-react";
import Link from 'next/link';

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: string;
}

interface AnswerRecord {
  selected: string;
  selectedIndex: number;
  correct: boolean;
}

export default function QuizPage() {
  const params = useParams();
  const pdfId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<Record<number, AnswerRecord>>({});
  const [difficulty, setDifficulty] = useState("mixed");
  const [error, setError] = useState('');
  const [isFinished, setIsFinished] = useState(false);
  const [resultSaved, setResultSaved] = useState(false);

  const fetchQuiz = useCallback(async (diff: string) => {
    setLoading(true);
    setError('');
    setCurrentIndex(0);
    setSelectedIndex(null);
    setShowResult(false);
    setAnswers({});
    setIsFinished(false);
    setResultSaved(false);

    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfId, difficulty: diff }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sınav oluşturulamadı');
      const quizData = data.quiz || data.questions || [];
      if (!Array.isArray(quizData) || quizData.length === 0) throw new Error('Soru listesi boş geldi.');
      setQuestions(quizData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [pdfId]);

  useEffect(() => {
    if (pdfId) fetchQuiz("mixed");
  }, [pdfId, fetchQuiz]);

  // Sınav bitince sonucu kaydet
  useEffect(() => {
    if (isFinished && !resultSaved && questions.length > 0) {
      const correctCount = Object.values(answers).filter(a => a.correct).length;
      fetch('/api/quiz-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdf_id: pdfId, score: correctCount, total: questions.length, difficulty }),
      }).catch(() => {});
      setResultSaved(true);
    }
  }, [isFinished, resultSaved, answers, questions.length, pdfId, difficulty]);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  const getCorrectIndex = (question: QuizQuestion): number => {
    const correctRaw = (question.correctAnswer || '').trim().toUpperCase();
    const singleLetter = correctRaw.match(/^([A-D])$/);
    if (singleLetter) return singleLetter[1].charCodeAt(0) - 65;
    const letterWithPunct = correctRaw.match(/^([A-D])[).\s]/);
    if (letterWithPunct) return letterWithPunct[1].charCodeAt(0) - 65;
    return question.options.findIndex(opt => opt.trim().toUpperCase() === correctRaw);
  };

  const handleAnswer = (optionIndex: number) => {
    if (showResult || !currentQuestion) return;
    const correctIdx = getCorrectIndex(currentQuestion);
    const isCorrect = optionIndex === correctIdx;
    setSelectedIndex(optionIndex);
    setShowResult(true);
    setAnswers(prev => ({
      ...prev,
      [currentIndex]: { selected: currentQuestion.options[optionIndex], selectedIndex: optionIndex, correct: isCorrect },
    }));
  };

  const handleNext = () => {
    if (isLastQuestion) { setIsFinished(true); return; }
    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    const prevAnswer = answers[nextIndex];
    setSelectedIndex(prevAnswer?.selectedIndex ?? null);
    setShowResult(prevAnswer !== undefined);
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      const prevAnswer = answers[prevIndex];
      setSelectedIndex(prevAnswer?.selectedIndex ?? null);
      setShowResult(prevAnswer !== undefined);
    }
  };

  const getScore = () => {
    const correctCount = Object.values(answers).filter(a => a.correct).length;
    return { correct: correctCount, total: questions.length };
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'easy': return 'bg-green-100 text-green-700 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'hard': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    }
  };

  const getDifficultyLabel = (diff: string) => {
    switch (diff) {
      case 'easy': return 'Kolay'; case 'medium': return 'Orta';
      case 'hard': return 'Zor'; default: return diff;
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-lg text-zinc-600 font-medium">Akıllı sınav hazırlanıyor...</p>
        <p className="text-sm text-zinc-400 mt-2">PDF içeriği analiz ediliyor</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <Card className="max-w-md w-full mx-4">
        <CardContent className="p-6 text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-zinc-800 mb-2">Hata</h2>
          <p className="text-zinc-600 mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => fetchQuiz(difficulty)} variant="outline">Tekrar Dene</Button>
            <Link href="/dashboard"><Button className="bg-blue-600 hover:bg-blue-700">Geri Dön</Button></Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (questions.length === 0 || !currentQuestion) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <p className="text-zinc-500">Sınav oluşturulamadı veya sorular yüklenemedi.</p>
    </div>
  );

  if (isFinished) {
    const score = getScore();
    const percentage = Math.round((score.correct / score.total) * 100);
    return (
      <div className="min-h-screen bg-zinc-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Card className="mb-6 border-0 shadow-lg">
            <CardContent className="p-8 text-center">
              <Trophy className={`w-16 h-16 mx-auto mb-4 ${percentage >= 70 ? 'text-yellow-500' : percentage >= 50 ? 'text-blue-500' : 'text-zinc-400'}`} />
              <h1 className="text-3xl font-bold text-zinc-800 mb-2">Sınav Tamamlandı!</h1>
              <p className="text-lg text-zinc-600 mb-2">{score.correct} / {score.total} doğru</p>
              <p className={`text-2xl font-bold mb-2 ${percentage >= 70 ? 'text-green-600' : percentage >= 50 ? 'text-blue-600' : 'text-red-600'}`}>%{percentage}</p>
              <p className="text-sm text-zinc-400 mb-6">✅ Sonuç kaydedildi</p>
              <div className="flex justify-center gap-4">
                <Button onClick={() => fetchQuiz(difficulty)} variant="outline" className="border-purple-200 text-purple-600 hover:bg-purple-50">
                  <GraduationCap className="w-4 h-4 mr-2" /> Yeni Sınav
                </Button>
                <Link href="/dashboard"><Button className="bg-blue-600 hover:bg-blue-700">Dashboard</Button></Link>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-zinc-800">Soru Özeti</h2>
            {questions.map((q, idx) => {
              const answer = answers[idx];
              if (!answer) return null;
              const correctIdx = getCorrectIndex(q);
              const correctOptionText = q.options[correctIdx] ?? q.correctAnswer;
              return (
                <Card key={q.id} className={`border-l-4 ${answer.correct ? 'border-l-green-500' : 'border-l-red-500'} border-0 shadow-sm`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {answer.correct ? <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" /> : <XCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />}
                      <div className="w-full">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getDifficultyColor(q.difficulty)}`}>{getDifficultyLabel(q.difficulty)}</span>
                          <span className="text-xs text-zinc-400">Soru {idx + 1}</span>
                        </div>
                        <p className="font-medium text-zinc-800 mb-2">{q.question}</p>
                        <p className="text-sm text-zinc-600">Cevabın: <span className={answer.correct ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>{answer.selected}</span></p>
                        {!answer.correct && <p className="text-sm text-green-600 mt-1">Doğru cevap: {correctOptionText}</p>}
                        <p className="text-sm text-zinc-500 mt-2 bg-zinc-50 p-2 rounded">💡 {q.explanation}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const safeOptions = Array.isArray(currentQuestion.options) ? currentQuestion.options : [];
  const correctIdx = getCorrectIndex(currentQuestion);

  return (
    <div className="min-h-screen bg-zinc-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <Link href="/dashboard" className="flex items-center gap-2 text-zinc-600 hover:text-zinc-800 transition-colors">
            <ArrowLeft className="w-5 h-5" /><span className="font-medium">Geri</span>
          </Link>
          <div className="flex items-center gap-2 text-sm text-zinc-500 bg-white px-3 py-1.5 rounded-full shadow-sm">
            <BookOpen className="w-4 h-4" /><span>Soru {currentIndex + 1} / {questions.length}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { key: 'easy', label: '🟢 Kolay', color: 'hover:bg-green-50 hover:border-green-200' },
            { key: 'mixed', label: '🟡 Karışık', color: 'hover:bg-yellow-50 hover:border-yellow-200' },
            { key: 'medium', label: '🟠 Orta', color: 'hover:bg-orange-50 hover:border-orange-200' },
            { key: 'hard', label: '🔴 Zor', color: 'hover:bg-red-50 hover:border-red-200' },
          ].map((d) => (
            <button key={d.key} onClick={() => { setDifficulty(d.key); fetchQuiz(d.key); }}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${difficulty === d.key ? 'bg-blue-600 text-white border-blue-600 shadow-md' : `bg-white text-zinc-600 border-zinc-200 ${d.color}`}`}>
              {d.label}
            </button>
          ))}
        </div>

        <div className="w-full bg-zinc-200 rounded-full h-2.5 mb-6 overflow-hidden">
          <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
        </div>

        <Card className="mb-6 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${getDifficultyColor(currentQuestion.difficulty)}`}>{getDifficultyLabel(currentQuestion.difficulty)}</span>
              <span className="text-xs text-zinc-400">Soru {currentIndex + 1}</span>
            </div>
            <h2 className="text-lg font-semibold text-zinc-800 mb-6 leading-relaxed">{currentQuestion.question}</h2>
            <div className="space-y-3">
              {safeOptions.map((option: string, idx: number) => {
                const isThisSelected = selectedIndex === idx;
                const isCorrectOption = idx === correctIdx;
                const showCorrect = showResult && isCorrectOption;
                const showWrong = showResult && isThisSelected && !isCorrectOption;
                return (
                  <button key={idx} onClick={() => handleAnswer(idx)} disabled={showResult}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${showCorrect ? 'border-green-500 bg-green-50 cursor-default' : showWrong ? 'border-red-500 bg-red-50 cursor-default' : isThisSelected ? 'border-blue-500 bg-blue-50' : showResult ? 'border-zinc-200 bg-white cursor-default opacity-60' : 'border-zinc-200 hover:border-blue-300 hover:bg-blue-50/50 bg-white cursor-pointer'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`font-medium ${showCorrect ? 'text-green-700' : showWrong ? 'text-red-700' : 'text-zinc-700'}`}>{option}</span>
                      {showCorrect && <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />}
                      {showWrong && <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>
            {showResult && (
              <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-sm text-blue-800 leading-relaxed"><span className="font-semibold">💡 Açıklama:</span> {currentQuestion.explanation}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between items-center mt-2">
          <Button variant="outline" onClick={handlePrev} disabled={currentIndex === 0} className="border-zinc-300 text-zinc-600">← Önceki</Button>
          {showResult ? (
            <Button onClick={handleNext} className={`px-8 ${isLastQuestion ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {isLastQuestion ? 'Sonuçları Gör →' : 'Sonraki Soru →'}
            </Button>
          ) : (
            <div className="text-sm font-medium text-zinc-400 animate-pulse">Cevaplamak için bir şıkka tıklayın</div>
          )}
        </div>
      </div>
    </div>
  );
}