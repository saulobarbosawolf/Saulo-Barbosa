import React, { useState, useMemo } from 'react';
import { TOPIC_TITLES } from './constants';
import type { Topic, AppState, QuizQuestion, MedalType } from './types';
import { generateContent, generateQuiz } from './services/geminiService';
import { ArrowLeftIcon, CheckCircleIcon, LoadingSpinner, MedalIcon, RobotIcon, XCircleIcon } from './components/Icons';

// --- UI COMPONENTS ---

const Header: React.FC = () => (
    <header className="w-full text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold font-orbitron text-cyan-400 tracking-widest">
            IoT Learning Quest
        </h1>
        <p className="text-gray-400 mt-2">Sua jornada pelo universo da Internet das Coisas</p>
    </header>
);

const LoadingOverlay: React.FC = () => (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-80 flex flex-col justify-center items-center z-50">
        <LoadingSpinner className="w-16 h-16 text-cyan-400" />
        <p className="mt-4 text-cyan-300 font-orbitron">Processando solicitação...</p>
    </div>
);

const ErrorDisplay: React.FC<{ message: string; onClear: () => void }> = ({ message, onClear }) => (
    <div className="bg-red-900 border border-red-500 text-red-200 px-4 py-3 rounded-lg relative my-4" role="alert">
        <strong className="font-bold">Erro: </strong>
        <span className="block sm:inline">{message}</span>
        <button onClick={onClear} className="absolute top-0 bottom-0 right-0 px-4 py-3">
            <span className="text-2xl">&times;</span>
        </button>
    </div>
);

const StyledButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }> = ({ children, ...props }) => (
    <button
        {...props}
        className={`w-full text-center bg-cyan-500 hover:bg-cyan-400 disabled:bg-gray-600 text-gray-900 font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-opacity-50 ${props.className}`}
    >
        {children}
    </button>
);

// --- SCREEN COMPONENTS ---

interface TopicSelectionScreenProps {
    topics: Topic[];
    onSelectTopic: (id: number) => void;
}
const TopicSelectionScreen: React.FC<TopicSelectionScreenProps> = ({ topics, onSelectTopic }) => (
    <div className="space-y-4">
        <h2 className="text-2xl font-orbitron text-center">Selecione um Tópico para Começar</h2>
        {topics.map((topic) => (
            <button
                key={topic.id}
                onClick={() => onSelectTopic(topic.id)}
                disabled={topic.isCompleted}
                className="w-full flex items-center justify-between text-left p-4 bg-gray-800 border-2 border-gray-700 rounded-lg hover:border-cyan-500 transition-colors duration-300 disabled:opacity-50 disabled:hover:border-gray-700"
            >
                <span className="flex-1 text-lg font-semibold">{topic.title}</span>
                {topic.isCompleted && (
                    <div className="flex items-center space-x-2 text-green-400">
                        <CheckCircleIcon className="w-6 h-6" />
                        <span>Concluído</span>
                    </div>
                )}
            </button>
        ))}
    </div>
);

interface ContentViewScreenProps {
    topic: Topic;
    onStartQuiz: () => void;
    onBack: () => void;
}
const ContentViewScreen: React.FC<ContentViewScreenProps> = ({ topic, onStartQuiz, onBack }) => (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 animate-fade-in">
        <button onClick={onBack} className="flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 mb-4">
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Voltar aos Tópicos</span>
        </button>
        <div className="flex items-start space-x-4">
            <RobotIcon className="w-16 h-16 text-cyan-400 flex-shrink-0 mt-2" />
            <div>
                <h2 className="text-3xl font-orbitron text-cyan-400 mb-4">{topic.title}</h2>
                <div className="prose prose-invert max-w-none text-gray-300 space-y-4 whitespace-pre-wrap">
                    {topic.content}
                </div>
            </div>
        </div>
        <StyledButton onClick={onStartQuiz} className="mt-8">
            Iniciar Quiz!
        </StyledButton>
    </div>
);

interface QuizViewScreenProps {
    topic: Topic;
    answers: (number | null)[];
    onAnswer: (questionIndex: number, answerIndex: number) => void;
    onSubmit: () => void;
    onNext: () => void;
    showFeedback: boolean;
}
const QuizViewScreen: React.FC<QuizViewScreenProps> = ({ topic, answers, onAnswer, onSubmit, onNext, showFeedback }) => {
    const quiz = topic.quiz!;
    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 animate-fade-in">
            <h2 className="text-3xl font-orbitron text-cyan-400 mb-6 text-center">{`Quiz: ${topic.title}`}</h2>
            <div className="space-y-8">
                {quiz.map((q, qIndex) => {
                    const userAnswer = answers[qIndex];
                    const isCorrect = userAnswer === q.correctAnswerIndex;

                    return (
                        <div key={qIndex}>
                            <p className="text-xl font-semibold mb-4">{`${qIndex + 1}. ${q.question}`}</p>
                            <div className="space-y-3">
                                {q.options.map((option, oIndex) => {
                                    let optionClass = "border-gray-600 bg-gray-700 hover:bg-gray-600";
                                    if (showFeedback) {
                                        if (oIndex === q.correctAnswerIndex) {
                                            optionClass = "border-green-500 bg-green-900 text-white";
                                        } else if (oIndex === userAnswer && !isCorrect) {
                                            optionClass = "border-red-500 bg-red-900 text-white";
                                        }
                                    } else if (oIndex === userAnswer) {
                                        optionClass = "border-cyan-500 bg-cyan-900";
                                    }

                                    return (
                                        <button
                                            key={oIndex}
                                            onClick={() => onAnswer(qIndex, oIndex)}
                                            disabled={showFeedback}
                                            className={`w-full text-left p-3 rounded-lg border-2 transition-all duration-200 flex items-center space-x-3 ${optionClass}`}
                                        >
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${oIndex === userAnswer ? 'border-cyan-400' : 'border-gray-500'}`}>
                                                {oIndex === userAnswer && <div className="w-3 h-3 bg-cyan-400 rounded-full" />}
                                            </div>
                                            <span>{option}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            {showFeedback && (
                                <div className={`mt-3 p-3 rounded-lg text-sm ${isCorrect ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>
                                    {isCorrect ? <CheckCircleIcon className="w-5 h-5 inline mr-2" /> : <XCircleIcon className="w-5 h-5 inline mr-2" />}
                                    <strong>Explicação:</strong> {q.explanation}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            {!showFeedback ? (
                <StyledButton onClick={onSubmit} disabled={answers.some(a => a === null)} className="mt-8">
                    Enviar Respostas
                </StyledButton>
            ) : (
                <StyledButton onClick={onNext} className="mt-8">
                    Continuar Jornada
                </StyledButton>
            )}
        </div>
    );
};

interface ResultsScreenProps {
    score: number;
    maxScore: number;
    medal: MedalType;
    onReset: () => void;
}
const ResultsScreen: React.FC<ResultsScreenProps> = ({ score, maxScore, medal, onReset }) => {
    const medalConfig = {
        gold: { color: '#FFD700', name: 'Ouro' },
        silver: { color: '#C0C0C0', name: 'Prata' },
        bronze: { color: '#CD7F32', name: 'Bronze' },
    };

    return (
        <div className="text-center bg-gray-800 p-8 rounded-lg shadow-lg border border-gray-700 animate-fade-in">
            <h2 className="text-4xl font-orbitron text-cyan-400">Jornada Concluída!</h2>
            <p className="text-gray-300 mt-2">Parabéns por completar o IoT Learning Quest.</p>
            <div className="my-8 flex justify-center">
                <MedalIcon className="w-48 h-48" color={medalConfig[medal].color} />
            </div>
            <h3 className="text-3xl font-orbitron">Medalha de {medalConfig[medal].name}</h3>
            <p className="text-2xl mt-4">
                Sua pontuação final: <span className="font-bold text-cyan-400">{score}</span> / {maxScore}
            </p>
            <StyledButton onClick={onReset} className="mt-10 max-w-sm mx-auto">
                Reiniciar Jornada
            </StyledButton>
        </div>
    );
};

// --- MAIN APP COMPONENT ---

const App: React.FC = () => {
    const [appState, setAppState] = useState<AppState>('topic_selection');
    const [topics, setTopics] = useState<Topic[]>(() =>
        TOPIC_TITLES.map((title, index) => ({
            id: index,
            title,
            content: null,
            quiz: null,
            isCompleted: false,
            score: null,
        }))
    );
    const [activeTopicId, setActiveTopicId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>([]);
    const [showQuizFeedback, setShowQuizFeedback] = useState<boolean>(false);

    const activeTopic = useMemo(() => topics.find(t => t.id === activeTopicId), [topics, activeTopicId]);
    const allTopicsCompleted = useMemo(() => topics.every(t => t.isCompleted), [topics]);
    const totalScore = useMemo(() => topics.reduce((acc, t) => acc + (t.score || 0), 0), [topics]);
    const maxScore = useMemo(() => topics.length * (topics[0]?.quiz?.length || 3), [topics]);

    const medal: MedalType | null = useMemo(() => {
        if (!allTopicsCompleted) return null;
        if(maxScore === 0) return 'bronze';
        const percentage = (totalScore / maxScore) * 100;
        if (percentage >= 90) return 'gold';
        if (percentage >= 70) return 'silver';
        return 'bronze';
    }, [allTopicsCompleted, totalScore, maxScore]);

    const handleSelectTopic = async (topicId: number) => {
        setError(null);
        setActiveTopicId(topicId);
        const currentTopic = topics.find(t => t.id === topicId)!;

        if (!currentTopic.content) {
            setIsLoading(true);
            try {
                const content = await generateContent(currentTopic.title);
                setTopics(prev => prev.map(t => (t.id === topicId ? { ...t, content } : t)));
                setAppState('content_view');
            } catch (e: any) {
                setError(e.message || "An unknown error occurred.");
            } finally {
                setIsLoading(false);
            }
        } else {
            setAppState('content_view');
        }
    };

    const handleStartQuiz = async () => {
        if (!activeTopic) return;
        setError(null);

        if (activeTopic.quiz) {
            setQuizAnswers(new Array(activeTopic.quiz.length).fill(null));
            setShowQuizFeedback(false);
            setAppState('quiz_view');
        } else {
            setIsLoading(true);
            try {
                const quiz = await generateQuiz(activeTopic.content!);
                setTopics(prev => prev.map(t => (t.id === activeTopic.id ? { ...t, quiz } : t)));
                setQuizAnswers(new Array(quiz.length).fill(null));
                setShowQuizFeedback(false);
                setAppState('quiz_view');
            } catch (e: any) {
                setError(e.message || "An unknown error occurred.");
                 setAppState('content_view');
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleAnswerQuiz = (qIndex: number, aIndex: number) => {
        setQuizAnswers(prev => prev.map((ans, i) => (i === qIndex ? aIndex : ans)));
    };

    const handleSubmitQuiz = () => {
        if (!activeTopic || !activeTopic.quiz) return;
        let score = 0;
        quizAnswers.forEach((answer, index) => {
            if (answer === activeTopic.quiz![index].correctAnswerIndex) {
                score++;
            }
        });
        setTopics(prev => prev.map(t => (t.id === activeTopicId ? { ...t, score, isCompleted: true } : t)));
        setShowQuizFeedback(true);
    };

    const handleNextAfterQuiz = () => {
        setShowQuizFeedback(false);
        if (topics.every(t => t.isCompleted)) {
            setAppState('results_view');
        } else {
            setAppState('topic_selection');
        }
    };

    const handleReset = () => {
        setTopics(TOPIC_TITLES.map((title, index) => ({
            id: index,
            title,
            content: null,
            quiz: null,
            isCompleted: false,
            score: null,
        })));
        setActiveTopicId(null);
        setAppState('topic_selection');
        setError(null);
    };

    const renderCurrentScreen = () => {
        switch (appState) {
            case 'content_view':
                return activeTopic && <ContentViewScreen topic={activeTopic} onStartQuiz={handleStartQuiz} onBack={() => setAppState('topic_selection')} />;
            case 'quiz_view':
                return activeTopic && <QuizViewScreen topic={activeTopic} answers={quizAnswers} onAnswer={handleAnswerQuiz} onSubmit={handleSubmitQuiz} onNext={handleNextAfterQuiz} showFeedback={showQuizFeedback} />;
            case 'results_view':
                return medal && <ResultsScreen score={totalScore} maxScore={maxScore} medal={medal} onReset={handleReset} />;
            case 'topic_selection':
            default:
                return <TopicSelectionScreen topics={topics} onSelectTopic={handleSelectTopic} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 lg:p-8">
            {isLoading && <LoadingOverlay />}
            <main className="w-full max-w-4xl mx-auto">
                <Header />
                {error && <ErrorDisplay message={error} onClear={() => setError(null)} />}
                {renderCurrentScreen()}
            </main>
        </div>
    );
};

export default App;
