import React, { useState, useEffect, useRef } from "react";

const Exam = () => {
  const duration = 2 * 60 * 1000; // 2 minutes
  const targetDateRef = useRef(new Date().getTime() + duration);

  const [timeLeft, setTimeLeft] = useState(duration);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [questions, setQuestions] = useState([]);

  // ✅ Load questions from localStorage on mount and on custom update event
  useEffect(() => {
    const loadQuestions = () => {
      const stored = localStorage.getItem("questions");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setQuestions(parsed);
        } catch (err) {
          console.error("Invalid questions data in localStorage", err);
          setQuestions([]);
        }
      }
    };

    loadQuestions(); // Initial load

    // Listen for updates from Admin
    window.addEventListener("questionsUpdated", loadQuestions);

    // Clean up the listener
    return () => {
      window.removeEventListener("questionsUpdated", loadQuestions);
    };
  }, []);

  // ✅ Countdown Timer
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const remaining = targetDateRef.current - now;

      if (remaining <= 0) {
        clearInterval(interval);
        setTimeLeft(0);
        alert("Time up");
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // ✅ Handle answer selection
  const handleOptionSelect = (qId, option) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [qId]: option,
    }));
  };

  // ✅ Format timer
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ color: timeLeft <= 6000 ? "red" : "green" }}>
        Time Left: {hours.toString().padStart(2, "0")}:
        {minutes.toString().padStart(2, "0")}:
        {seconds.toString().padStart(2, "0")}
      </h2>

      <div>
        {questions.length === 0 ? (
          <p>No questions available.</p>
        ) : (
          questions.map((q) => (
            <div key={q.id} style={{ marginBottom: "20px" }}>
              <h4>
                {q.id}. {q.question}
              </h4>
              {q.options.map((opt, index) => (
                <div key={index}>
                  <label>
                    <input
                      type="radio"
                      name={`question-${q.id}`}
                      value={opt}
                      checked={selectedAnswers[q.id] === opt}
                      onChange={() => handleOptionSelect(q.id, opt)}
                    />
                    {opt}
                  </label>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Exam;
