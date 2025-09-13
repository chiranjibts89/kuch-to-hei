import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle, Award, Book } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useStudent } from '../contexts/StudentContext';

const LessonDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { completeLesson } = useAuth();
  const { lessons, completedLessons } = useStudent();
  const [currentSection, setCurrentSection] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);

  const lesson = lessons.find(l => l.id === id);
  const isCompleted = lesson ? completedLessons.includes(lesson.id) : false;

  if (!lesson) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-white">Lesson not found</h1>
        <button
          onClick={() => navigate('/lessons')}
          className="mt-4 px-6 py-2 bg-gradient-to-r from-[#F8D991] to-[#F6B080] text-[#091D23] rounded-lg hover:shadow-lg font-semibold"
        >
          Back to Lessons
        </button>
      </div>
    );
  }

  const handleNextSection = () => {
    if (currentSection < lesson.content.sections.length - 1) {
      setCurrentSection(currentSection + 1);
    } else {
      setShowQuiz(true);
    }
  };

  const handlePrevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const handleQuizAnswer = () => {
    if (selectedAnswer === null) return;

    const newAnswers = [...userAnswers];
    newAnswers[currentQuestion] = selectedAnswer;
    setUserAnswers(newAnswers);

    let newScore = quizScore;
    if (selectedAnswer === lesson.quiz.questions[currentQuestion].correctAnswer) {
      newScore = quizScore + 1;
      setQuizScore(newScore);
    }

    setTimeout(() => {
      if (currentQuestion < lesson.quiz.questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
      } else {
        setShowResult(true);
        if (newScore >= Math.ceil(lesson.quiz.questions.length * 0.7)) {
          completeLesson(lesson.id, newScore);
        }
      }
    }, 1500);
  };

  const restartQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setQuizScore(0);
    setUserAnswers([]);
    setShowQuiz(true);
  };

  if (showQuiz) {
    if (showResult) {
      const passed = quizScore >= Math.ceil(lesson.quiz.questions.length * 0.7);
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl mx-auto"
        >
          <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl shadow-xl p-8 text-center">
            <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
              passed ? 'bg-green-500/20' : 'bg-red-500/20'
            }`}>
              {passed ? (
                <CheckCircle className="h-12 w-12 text-green-400" />
              ) : (
                <div className="text-red-400 text-2xl">✗</div>
              )}
            </div>
            
            <h2 className="text-3xl font-bold mb-4 text-white">
              {passed ? '🎉 Congratulations!' : '😔 Not quite there'}
            </h2>
            
            <p className="text-xl text-white/70 mb-6">
              You scored {quizScore} out of {lesson.quiz.questions.length}
            </p>
            
            {passed ? (
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center space-x-2 text-green-400">
                  <Award className="h-5 w-5" />
                  <span className="font-semibold">+{lesson.points} Eco Points Earned!</span>
                </div>
                <p className="text-green-300 text-sm mt-2">Lesson completed successfully!</p>
              </div>
            ) : (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
                <p className="text-red-300">
                  You need at least {Math.ceil(lesson.quiz.questions.length * 0.7)} correct answers to pass.
                </p>
              </div>
            )}
            
            <div className="flex space-x-4 justify-center">
              <button
                onClick={restartQuiz}
                className="px-6 py-2 bg-gradient-to-r from-[#F8D991] to-[#F6B080] text-[#091D23] rounded-lg hover:shadow-lg font-semibold"
              >
                Retake Quiz
              </button>
              <button
                onClick={() => navigate('/lessons')}
                className="px-6 py-2 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20"
              >
                Back to Lessons
              </button>
            </div>
          </div>
        </motion.div>
      );
    }

    const question = lesson.quiz.questions[currentQuestion];
    const hasAnswered = selectedAnswer !== null;
    const isCorrect = selectedAnswer === question.correctAnswer;

    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="max-w-2xl mx-auto"
      >
        <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl shadow-xl p-8">
          {/* Quiz Progress */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-white/70">
                Question {currentQuestion + 1} of {lesson.quiz.questions.length}
              </span>
              <span className="text-sm font-medium text-white/70">
                Score: {quizScore}/{lesson.quiz.questions.length}
              </span>
            </div>
            <div className="bg-white/20 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-[#F6B080] to-[#F8D991] rounded-full h-2"
                initial={{ width: 0 }}
                animate={{ width: `${((currentQuestion + 1) / lesson.quiz.questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question */}
          <h2 className="text-2xl font-bold text-white mb-6">{question.question}</h2>

          {/* Options */}
          <div className="space-y-3 mb-6">
            {question.options.map((option, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: hasAnswered ? 1 : 1.02 }}
                onClick={() => !hasAnswered && setSelectedAnswer(index)}
                disabled={hasAnswered}
                className={`w-full p-4 text-left rounded-lg border transition-all ${
                  hasAnswered
                    ? index === question.correctAnswer
                      ? 'bg-green-500/20 border-green-500/50 text-green-300'
                      : index === selectedAnswer
                      ? 'bg-red-500/20 border-red-500/50 text-red-300'
                      : 'bg-white/5 border-white/20 text-white/60'
                    : selectedAnswer === index
                    ? 'bg-[#E1664C]/20 border-[#E1664C]/50 text-[#E1664C]'
                    : 'bg-white/10 border-white/20 hover:border-[#E1664C]/50 hover:bg-white/15 text-white'
                }`}
              >
                <span className="flex items-center">
                  <span className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center text-sm font-semibold ${
                    hasAnswered && index === question.correctAnswer
                      ? 'border-green-500 bg-green-500 text-white'
                      : hasAnswered && index === selectedAnswer && index !== question.correctAnswer
                      ? 'border-red-500 bg-red-500 text-white'
                      : selectedAnswer === index
                      ? 'border-[#E1664C] bg-[#E1664C] text-white'
                      : 'border-white/40'
                  }`}>
                    {hasAnswered && index === question.correctAnswer ? '✓' :
                     hasAnswered && index === selectedAnswer && index !== question.correctAnswer ? '✗' :
                     String.fromCharCode(65 + index)}
                  </span>
                  {option}
                </span>
              </motion.button>
            ))}
          </div>

          {/* Explanation */}
          {hasAnswered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg mb-6 ${
                isCorrect ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'
              }`}
            >
              <h4 className={`font-semibold mb-2 ${isCorrect ? 'text-green-300' : 'text-red-300'}`}>
                {isCorrect ? '✅ Correct!' : '❌ Incorrect'}
              </h4>
              <p className="text-white/80">{question.explanation}</p>
            </motion.div>
          )}

          {/* Next Button */}
          <button
            onClick={handleQuizAnswer}
            disabled={selectedAnswer === null}
            className={`w-full py-3 rounded-lg font-semibold ${
              selectedAnswer === null
                ? 'bg-white/10 text-white/50 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#F8D991] to-[#F6B080] text-[#091D23] hover:shadow-lg'
            }`}
          >
            {currentQuestion < lesson.quiz.questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
          </button>
        </div>
      </motion.div>
    );
  }

  const currentSectionData = lesson.content.sections[currentSection];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/lessons')}
          className="flex items-center space-x-2 text-white/70 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Lessons</span>
        </button>
        {isCompleted && (
          <div className="flex items-center space-x-2 text-green-400">
            <CheckCircle className="h-5 w-5" />
            <span className="font-semibold">Completed</span>
          </div>
        )}
      </div>

      {/* Lesson Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl shadow-xl p-6 mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-white">{lesson.title}</h1>
          <div className="flex items-center space-x-2 text-[#F8D991]">
            <Award className="h-5 w-5" />
            <span className="font-semibold">{lesson.points} points</span>
          </div>
        </div>
        <p className="text-white/70 mb-4">{lesson.description}</p>
        
        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-white/70">
              Section {currentSection + 1} of {lesson.content.sections.length}
            </span>
          </div>
          <div className="bg-white/20 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-[#F6B080] to-[#F8D991] rounded-full h-2"
              initial={{ width: 0 }}
              animate={{ width: `${((currentSection + 1) / lesson.content.sections.length) * 100}%` }}
            />
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSection}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl shadow-xl p-8 mb-6"
        >
          <h2 className="text-2xl font-bold text-white mb-6">{currentSectionData.title}</h2>
          
          {(currentSectionData.imageUrl || lesson.image_url) && (
            <img
              src={currentSectionData.imageUrl || lesson.image_url}
              alt={currentSectionData.title}
              className="w-full h-64 object-cover rounded-lg mb-6"
            />
          )}
          
          <div className="prose max-w-none">
            <p className="text-white/80 leading-relaxed text-lg">{currentSectionData.content}</p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevSection}
          disabled={currentSection === 0}
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold ${
            currentSection === 0
              ? 'bg-white/10 text-white/50 cursor-not-allowed'
              : 'bg-white/20 border border-white/30 text-white hover:bg-white/30'
          }`}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Previous</span>
        </button>

        <div className="flex items-center space-x-2 text-white/70">
          <Book className="h-4 w-4" />
          <span className="text-sm">
            {currentSection + 1} / {lesson.content.sections.length} sections
          </span>
        </div>

        <button
          onClick={handleNextSection}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#F8D991] to-[#F6B080] text-[#091D23] rounded-lg font-semibold hover:shadow-lg"
        >
          <span>{currentSection === lesson.content.sections.length - 1 ? 'Take Quiz' : 'Next'}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default LessonDetail;