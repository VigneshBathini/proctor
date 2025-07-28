import React, { useState, useEffect } from "react";

const Questions = () => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [allQuestions, setAllQuestions] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem("questions");
    if (stored) {
      setAllQuestions(JSON.parse(stored));
    }
  }, []);

  const handleOptions = (index, e) => {
    const updatedOptions = [...options];
    updatedOptions[index] = e.target.value;
    setOptions(updatedOptions);
  };

  const submitQuestions = (e) => {
    e.preventDefault();

    if (!question.trim() || options.some(opt => !opt.trim())) {
      alert("Please fill in the question and all options.");
      return;
    }

    if (!correctAnswer.trim()) {
      alert("Please enter the correct answer.");
      return;
    }

    if (!options.includes(correctAnswer.trim())) {
      alert("Correct answer must match one of the options exactly.");
      return;
    }

    const newEntry = {
      question,
      options,
      correctAnswer: correctAnswer.trim()
    };

    const updatedQuestions = [...allQuestions, newEntry];
    setAllQuestions(updatedQuestions);
    localStorage.setItem("questions", JSON.stringify(updatedQuestions));

    setQuestion('');
    setOptions(['', '', '', '']);
    setCorrectAnswer('');
  };

  const styles = {
    container: {
      maxWidth: "600px",
      margin: "30px auto",
      padding: "20px",
      border: "1px solid #ccc",
      borderRadius: "8px",
      boxShadow: "0px 0px 10px rgba(0,0,0,0.1)",
      backgroundColor: "#fdfdfd"
    },
    input: {
      width: "100%",
      padding: "10px",
      marginBottom: "15px",
      borderRadius: "5px",
      border: "1px solid #ddd",
      fontSize: "16px"
    },
    button: {
      padding: "10px 20px",
      backgroundColor: "#1c3681",
      color: "white",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
      fontSize: "16px"
    },
    questionList: {
      marginTop: "30px",
      backgroundColor: "#fafafa",
      padding: "15px",
      borderRadius: "8px"
    },
    questionBlock: {
      marginBottom: "20px",
      padding: "10px",
      border: "1px solid #eee",
      borderRadius: "5px",
      backgroundColor: "#fff"
    },
    questionTitle: {
      fontWeight: "bold",
      fontSize: "17px"
    },
    optionItem: {
      marginLeft: "20px",
      listStyle: "disc",
      color: "#333"
    }
  };

  return (
    <div style={styles.container}>
      <h2>Create Question</h2>

      <form onSubmit={submitQuestions}>
        <label><strong>Question</strong></label>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          style={styles.input}
          placeholder="Enter your question"
        />

        <label><strong>Options</strong></label>
        {options.map((opt, index) => (
          <input
            key={index}
            type="text"
            value={opt}
            onChange={(e) => handleOptions(index, e)}
            placeholder={`Option ${index + 1}`}
            style={styles.input}
          />
        ))}

        <label><strong>Correct Answer (type exactly as one of the options)</strong></label>
        <input
          type="text"
          value={correctAnswer}
          onChange={(e) => setCorrectAnswer(e.target.value)}
          style={styles.input}
          placeholder="Correct Answer"
        />

        <button type="submit" style={styles.button}>Submit Question</button>
      </form>

      {allQuestions.length > 0 && (
        <div style={styles.questionList}>
          <h3>Submitted Questions</h3>
          {allQuestions.map((q, idx) => (
            <div key={idx} style={styles.questionBlock}>
              <div style={styles.questionTitle}>Q{idx + 1}: {q.question}</div>
              <ul>
                {q.options.map((opt, i) => (
                  <li key={i} style={styles.optionItem}>
                    {String.fromCharCode(65 + i)}. {opt}
                    {opt === q.correctAnswer && (
                      <strong style={{ color: "green" }}> (Correct)</strong>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Questions;
