import { useState } from "react";
import type { QuizQuestion } from "../../data/quizzes";

interface Props {
  slug: string;
  articleTitle: string;
  questions: QuizQuestion[];
}

const LABELS = ["A", "B", "C", "D"] as const;

function gradeMessage(score: number, total: number) {
  const pct = score / total;
  if (pct === 1) return "Perfect score! You really know your stuff.";
  if (pct >= 0.8) return "Great job! You clearly read the article.";
  if (pct >= 0.6) return "Not bad! You got the key points.";
  return "Worth a re-read! Scroll up and try again.";
}

export default function ArticleQuiz({ slug, articleTitle, questions }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(
    () => Array(questions.length).fill(null),
  );
  const [revealed, setRevealed] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [shareState, setShareState] = useState<"idle" | "copied" | "shared">(
    "idle",
  );

  const score = answers.filter((a, i) => a === questions[i].correctIndex).length;
  const current = questions[currentIndex];

  // ── Handlers ──

  function handleSelect(choiceIndex: number) {
    if (revealed) return;
    const next = [...answers];
    next[currentIndex] = choiceIndex;
    setAnswers(next);
    setRevealed(true);
  }

  function handleNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setRevealed(false);
    } else {
      setIsComplete(true);
    }
  }

  function handleRetake() {
    setCurrentIndex(0);
    setAnswers(Array(questions.length).fill(null));
    setRevealed(false);
    setIsComplete(false);
    setShowReview(false);
    setShareState("idle");
  }

  async function handleShare() {
    const shareText = `I scored ${score}/${questions.length} on "${articleTitle}" at The Midterm Project!\n\nTest yourself:`;
    const shareUrl = `https://themidtermproject.com/learn/${slug}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Quiz: ${articleTitle}`,
          text: shareText,
          url: shareUrl,
        });
        setShareState("shared");
        setTimeout(() => setShareState("idle"), 2000);
        return;
      } catch {
        // User cancelled or API failed — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      setShareState("copied");
      setTimeout(() => setShareState("idle"), 2000);
    } catch {
      // Clipboard failed silently
    }
  }

  // ── Collapsed State ──

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full text-left bg-navy/5 border border-navy/20 hover:border-navy/40 rounded-xl p-5 transition-colors group cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-navy text-lg">Test Your Knowledge</p>
            <p className="text-sm text-slate-500 mt-0.5">
              {questions.length} questions about this article
            </p>
          </div>
          <span className="text-navy/60 group-hover:text-navy transition-colors text-2xl">
            &#8250;
          </span>
        </div>
      </button>
    );
  }

  // ── Results State ──

  if (isComplete) {
    return (
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
        <p className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">
          Quiz Results
        </p>

        <div className="text-center py-4">
          <p className="text-5xl font-bold text-navy">
            {score}/{questions.length}
          </p>
          <p className="text-slate-600 mt-2">{gradeMessage(score, questions.length)}</p>
        </div>

        <div className="flex gap-3 justify-center mt-4">
          <button
            onClick={handleShare}
            className="bg-slate-900 text-white font-semibold py-2.5 px-5 rounded-xl hover:bg-slate-800 transition-colors text-sm cursor-pointer"
          >
            {shareState === "idle"
              ? "Share Score"
              : shareState === "copied"
                ? "Copied!"
                : "Shared!"}
          </button>
          <button
            onClick={handleRetake}
            className="border border-slate-300 text-slate-700 font-semibold py-2.5 px-5 rounded-xl hover:bg-slate-100 transition-colors text-sm cursor-pointer"
          >
            Try Again
          </button>
        </div>

        {/* Review toggle */}
        <div className="mt-6 border-t border-slate-200 pt-4">
          <button
            onClick={() => setShowReview(!showReview)}
            className="text-sm font-medium text-dem hover:underline cursor-pointer"
          >
            {showReview ? "Hide Answers" : "Review Answers"}
          </button>

          {showReview && (
            <div className="mt-4 space-y-4">
              {questions.map((q, qi) => {
                const userAnswer = answers[qi];
                const isCorrect = userAnswer === q.correctIndex;
                return (
                  <div key={qi} className="text-sm">
                    <p className="font-medium text-slate-700 mb-1">
                      <span className={isCorrect ? "text-green-600" : "text-red-600"}>
                        {isCorrect ? "\u2713" : "\u2717"}
                      </span>{" "}
                      {q.question}
                    </p>
                    {!isCorrect && userAnswer !== null && (
                      <p className="text-red-600 ml-5">
                        Your answer: {LABELS[userAnswer]}) {q.choices[userAnswer]}
                      </p>
                    )}
                    <p className="text-green-700 ml-5">
                      Correct: {LABELS[q.correctIndex]}) {q.choices[q.correctIndex]}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Active Question State ──

  const selected = answers[currentIndex];

  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
      {/* Header + progress */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
          Test Your Knowledge
        </p>
        <p className="text-sm text-slate-400">
          {currentIndex + 1} / {questions.length}
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5 mb-6">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full flex-1 transition-colors ${
              i < currentIndex
                ? "bg-dem"
                : i === currentIndex
                  ? "bg-navy"
                  : "bg-slate-200"
            }`}
          />
        ))}
      </div>

      {/* Question */}
      <p className="font-semibold text-navy text-lg mb-4">{current.question}</p>

      {/* Choices */}
      <div className="space-y-2.5">
        {current.choices.map((choice, ci) => {
          const isSelected = selected === ci;
          const isCorrect = ci === current.correctIndex;

          let style =
            "border border-slate-200 hover:border-navy/30 bg-white";

          if (revealed) {
            if (isCorrect) {
              style = "border-green-500 bg-green-50";
            } else if (isSelected && !isCorrect) {
              style = "border-red-500 bg-red-50";
            } else {
              style = "border border-slate-100 bg-white opacity-60";
            }
          } else if (isSelected) {
            style = "border-dem bg-dem/5";
          }

          return (
            <button
              key={ci}
              onClick={() => handleSelect(ci)}
              disabled={revealed}
              className={`w-full text-left rounded-lg p-3.5 transition-colors text-sm flex items-start gap-3 min-h-[44px] ${style} ${
                revealed ? "cursor-default" : "cursor-pointer"
              }`}
            >
              <span
                className={`font-bold shrink-0 mt-0.5 ${
                  revealed && isCorrect
                    ? "text-green-700"
                    : revealed && isSelected && !isCorrect
                      ? "text-red-700"
                      : "text-slate-400"
                }`}
              >
                {LABELS[ci]})
              </span>
              <span
                className={
                  revealed && isCorrect
                    ? "text-green-800"
                    : revealed && isSelected && !isCorrect
                      ? "text-red-800"
                      : "text-slate-700"
                }
              >
                {choice}
              </span>
            </button>
          );
        })}
      </div>

      {/* Explanation + Next button (after reveal) */}
      {revealed && (
        <div className="mt-4 space-y-3">
          {current.explanation && (
            <div
              className={`rounded-lg p-3 text-sm ${
                selected === current.correctIndex
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {selected === current.correctIndex ? "\u2713 " : "\u2717 "}
              {current.explanation}
            </div>
          )}

          <button
            onClick={handleNext}
            className="bg-navy text-white font-semibold py-2.5 px-5 rounded-xl hover:bg-navy/90 transition-colors text-sm cursor-pointer"
          >
            {currentIndex < questions.length - 1
              ? "Next Question \u2192"
              : "See Results"}
          </button>
        </div>
      )}
    </div>
  );
}
