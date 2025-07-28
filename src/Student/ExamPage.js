import React, { useState, useEffect, useRef } from "react";

const ExamPage = () => {
  const duration = 2 * 60 * 1000; // 2 minutes
  const targetDateRef = useRef(new Date().getTime() + duration);

  const [timeLeft, setTimeLeft] = useState(duration);
  const [selectedAnswer, setSelectedAnswer] = useState([]);
  const [testResult, setTestResult] = useState(null);

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

  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  const quiz = {
    topic: "JavaScript",
    level: "Beginner",
    totalQuestions: 4,
    perQuestionScore: 5,
    questions: [
      {
        question: "Which function is used to serialize an object into a JSON string in Javascript?",
        choices: ["stringify()", "parse()", "convert()", "None of the above"],
        correctAnswer: "stringify()",
      },
      {
        question: "Which of the following keywords is used to define a variable in Javascript?",
        choices: ["var", "let", "var and let", "None of the above"],
        correctAnswer: "var and let",
      },
      {
        question: "Which of the following methods can be used to display data in some form using Javascript?",
        choices: ["document.write()", "console.log()", "window.alert", "All of the above"],
        correctAnswer: "All of the above",
      },
      {
        question: "How can a datatype be declared to be a constant type?",
        choices: ["const", "var", "let", "constant"],
        correctAnswer: "const",
      },
    ],
  };

  const handleSelectOption = (index, choice) => {
    const updatedAnswers = [...selectedAnswer];
    updatedAnswers[index] = choice;
    setSelectedAnswer(updatedAnswers);
  };

  const getResults = () => {
    let score = 0;
    selectedAnswer.forEach((answer, index) => {
      if (answer === quiz.questions[index].correctAnswer) {
        score++;
      }
    });
    setTestResult(score);
  };

  const styles = {
    container: {
      maxWidth: "800px",
      margin: "40px auto",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      padding: "20px",
      backgroundColor: "#f4f8fc",
      borderRadius: "16px",
      boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
    },
    header: {
      textAlign: "center",
      marginBottom: "20px",
    },
    timer: {
      backgroundColor: timeLeft <= 6000 ? "#ffe6e6" : "#e0f7fa",
      color: timeLeft <= 6000 ? "#c62828" : "#0277bd",
      fontWeight: "bold",
      fontSize: "18px",
      padding: "12px",
      borderRadius: "10px",
      textAlign: "center",
      marginBottom: "25px",
    },
    questionCard: {
      backgroundColor: "#fff",
      borderRadius: "12px",
      padding: "20px",
      margin: "20px 0",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    },
    questionText: {
      fontWeight: "600",
      fontSize: "18px",
      marginBottom: "15px",
    },
    choiceButton: (isSelected) => ({
      backgroundColor: isSelected ? "#1c3681" : "#f1f1f1",
      color: isSelected ? "#fff" : "#333",
      border: "1px solid #ccc",
      borderRadius: "8px",
      padding: "10px 18px",
      margin: "8px 12px 8px 0",
      cursor: "pointer",
      transition: "all 0.3s ease",
      fontWeight: "500",
      boxShadow: isSelected ? "0 4px 8px rgba(28,54,129,0.3)" : "none",
      outline: "none",
    }),
    submitBtn: {
      display: "block",
      margin: "30px auto 10px",
      backgroundColor: "#1c3681",
      color: "white",
      padding: "14px 36px",
      border: "none",
      borderRadius: "8px",
      fontSize: "16px",
      fontWeight: "bold",
      cursor: "pointer",
      boxShadow: "0 6px 12px rgba(0,0,0,0.2)",
    },
    resultText: {
      marginTop: "20px",
      textAlign: "center",
      fontSize: "20px",
      fontWeight: "bold",
      color: "#1c3681",
    },
    logoutBtn: {
      float: "right",
      marginTop: "-65px",
      marginRight: "10px",
      backgroundColor: "#d32f2f",
      color: "white",
      padding: "8px 16px",
      border: "none",
      borderRadius: "6px",
      fontSize: "14px",
      cursor: "pointer",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>{quiz.topic} Quiz</h2>
        <p>Level: {quiz.level}</p>
      </div>

      <div style={styles.timer}>
        Time Left: {hours.toString().padStart(2, "0")}:
        {minutes.toString().padStart(2, "0")}:
        {seconds.toString().padStart(2, "0")}
      </div>

      <button style={styles.logoutBtn}>Logout</button>

{testResult !== null && (
        <div style={styles.resultText}>
          Your Score: {testResult} / {quiz.totalQuestions}
        </div>
      )}
      {quiz.questions.map((item, index) => (
        <div style={styles.questionCard} key={index}>
          <div style={styles.questionText}>
            Q{index + 1}. {item.question}
          </div>
          <div>
            {item.choices.map((choice, i) => (
              <button
                key={i}
                onClick={() => handleSelectOption(index, choice)}
                style={styles.choiceButton(selectedAnswer[index] === choice)}
              >
                {String.fromCharCode(97 + i)}. {choice}
              </button>
            ))}
          </div>
        </div>
      ))}

      <button onClick={getResults} style={styles.submitBtn}>
        Submit
      </button>

      
    </div>
  );
};

export default ExamPage;
