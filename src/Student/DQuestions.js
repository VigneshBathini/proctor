import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import { RotatingLines } from 'react-loader-spinner';

// Question bank (for fallback)
const questionBank = [
  {
    id: 1,
    type: 'MCQ',
    question: "What does `map()` do in JavaScript?",
    options: ["Loops without return", "Transforms array elements", "Filters elements", "Reduces array"],
    answer: "Transforms array elements",
    difficulty: "Easy",
    category: "JavaScript",
  },
  {
    id: 2,
    type: 'TrueFalse',
    question: "`let` allows redeclaration in the same scope.",
    options: ["True", "False"],
    answer: "False",
    difficulty: "Easy",
    category: "JavaScript",
  },
  {
    id: 3,
    type: 'ShortAnswer',
    question: "Name the method to combine two arrays in JavaScript.",
    answer: "concat",
    difficulty: "Medium",
    category: "JavaScript",
  },
  {
    id: 4,
    type: 'Essay',
    question: "Explain the difference between `let`, `const`, and `var` in JavaScript.",
    answer: "`let` and `const` are block-scoped; `var` is function-scoped. `const` cannot be reassigned.",
    difficulty: "Hard",
    category: "JavaScript",
  },
  {
    id: 5,
    type: 'Coding',
    question: "Write a function to reverse a string in JavaScript.",
    answer: "function reverseString(str) { return str.split('').reverse().join(''); }",
    testCases: [
      { input: "'hello'", output: "'olleh'" },
      { input: "'JavaScript'", output: "'tpircSavaJ'" },
    ],
    difficulty: "Medium",
    category: "JavaScript",
  },
];

const DQuestions = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userDetails = location.state || {};
  const duration = 2 * 60 * 1000; // 2 minutes
  const targetDateRef = useRef(new Date().getTime() + duration);

  // State
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [hasMicPermission, setHasMicPermission] = useState(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [cheatCount, setCheatCount] = useState(0);
  const [cheatLogs, setCheatLogs] = useState([]);
  const [answers, setAnswers] = useState({});
  const [codeOutput, setCodeOutput] = useState({});
  const [sessionTime, setSessionTime] = useState(0);
  const [modalVisible, setModalVisible] = useState(true);
  const [lastWarning, setLastWarning] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [examCompleted, setExamCompleted] = useState(false);
  const [examReport, setExamReport] = useState('');
  const [questions, setQuestions] = useState([]);
  const [examHistory, setExamHistory] = useState([]);
  const [reviewMode, setReviewMode] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [faceDetectionError, setFaceDetectionError] = useState(null);
  const [modelLoadError, setModelLoadError] = useState(null);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [videoConstraints, setVideoConstraints] = useState({
    width: window.innerWidth < 768 ? window.innerWidth * 0.35 : 200,
    height: window.innerWidth < 768 ? window.innerWidth * 0.26 : 150,
    facingMode: 'user',
  });
  const [examSettings, setExamSettings] = useState({
    duration: duration / 1000,
    questionCount: 5,
    maxViolations: 3,
  });
  const [gracePeriod, setGracePeriod] = useState(true);
  const [warningMessage, setWarningMessage] = useState('');
  const [proctoringActive, setProctoringActive] = useState(false);
  const [warningLevels, setWarningLevels] = useState({
    FaceDetection: 0,
    MultipleFaces: 0,
    Audio: 0,
    TabSwitch: 0,
    FaceMovement: 0,
    Lighting: 0,
  });
  const [alertQueue, setAlertQueue] = useState([]);
  const [currentAlert, setCurrentAlert] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [faceDetectionBuffer, setFaceDetectionBuffer] = useState([]);
  const [alertLogs, setAlertLogs] = useState([]); // Track all triggered alerts
  const brightnessCanvasRef = useRef(document.createElement('canvas'));

  const webcamRef = useRef(null);
  const audioContextRef = useRef(null);
  const timerRef = useRef(null);
  const faceDetectionIntervalRef = useRef(null);
  const audioIntervalRef = useRef(null);
  const lastInputTime = useRef(0);
  const lastStateChange = useRef(Date.now());
  const lastAlertTime = useRef({});
  const hasWarnedRef = useRef(false);
  const violationResetTime = useRef({}); // Track when each violation can reset

  // Constants
  const APP_SWITCH_THRESHOLD = 2000;
  const AUDIO_THRESHOLD = 0.08;
  const MOVEMENT_THRESHOLD = 0.6;
  const ALERT_DEBOUNCE_MS = 15000; // Increased to 15s to reduce spam
  const VIOLATION_RESET_MS = 30000; // Reset violation after 30s if resolved
  const GRACE_PERIOD_MS = 5000;
  const FACE_DETECTION_BUFFER_SIZE = 10;
  const FACE_DETECTION_BUFFER_THRESHOLD = 0.5; // Lowered threshold to be more lenient
  const BRIGHTNESS_THRESHOLD = 30;

  // Centralized alert management with violation tracking
  const triggerAlert = useCallback((message, violationType) => {
    const now = Date.now();
    const lastAlert = lastAlertTime.current[violationType] || 0;
    const lastAnyAlert = lastAlertTime.current._lastAnyAlert || 0;

    if (now - lastAlert < ALERT_DEBOUNCE_MS || now - lastAnyAlert < 2000) {
      console.log(`Debouncing alert: ${violationType} (last: ${new Date(lastAlert).toLocaleTimeString()})`);
      return;
    }

    console.log(`Triggering alert: ${message} (${violationType}) at ${new Date(now).toLocaleTimeString()}`);
    setAlertQueue((prev) => [...prev, { message, violationType, timestamp: now }]);
    setAlertLogs((prev) => [
      ...prev,
      { message, violationType, timestamp: now, triggered: true },
    ]);
    lastAlertTime.current[violationType] = now;
    lastAlertTime.current._lastAnyAlert = now;

    // Increment cheat count only if not already counted for this violation type
    if (!violationResetTime.current[violationType] || now - violationResetTime.current[violationType] >= VIOLATION_RESET_MS) {
      setCheatCount((prev) => {
        const newCount = prev + 1;
        const timestamp = new Date().toLocaleString();
        setCheatLogs((logs) => [...logs, { message, timestamp, type: violationType }]);
        violationResetTime.current[violationType] = now;

        if (newCount >= examSettings.maxViolations) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance('Test ended due to too many violations.');
          utterance.lang = 'en-US';
          window.speechSynthesis.speak(utterance);
          alert('Test Terminated: Too many violations detected.');
          submitTest(true);
        }
        return newCount;
      });
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = 'en-US';
    utterance.pitch = 1.0;
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }, []);

  // Process alert queue
  useEffect(() => {
    if (alertQueue.length === 0) return;

    if (!currentAlert) {
      const nextAlert = alertQueue[0];
      setCurrentAlert(nextAlert);
      setAlertQueue((prev) => prev.slice(1));

      const timeout = setTimeout(() => {
        setCurrentAlert(null);
      }, 4000);

      return () => clearTimeout(timeout);
    }
  }, [alertQueue, currentAlert]);

  // Calculate brightness
  const getAverageBrightness = (video) => {
    try {
      const canvas = brightnessCanvasRef.current;
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let sum = 0;
      for (let i = 0; i < data.length; i += 4) {
        const brightness = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        sum += brightness;
      }
      return sum / (canvas.width * canvas.height);
    } catch (err) {
      console.error("Brightness calculation error:", err);
      return null;
    }
  };

  // Handle resize and orientation changes
  useEffect(() => {
    const handleResizeOrOrientation = () => {
      setVideoConstraints({
        width: window.innerWidth < 768 ? window.innerWidth * 0.35 : 200,
        height: window.innerWidth < 768 ? window.innerWidth * 0.26 : 150,
        facingMode: 'user',
      });
    };
    window.addEventListener('resize', handleResizeOrOrientation);
    window.addEventListener('orientationchange', handleResizeOrOrientation);
    return () => {
      window.removeEventListener('resize', handleResizeOrOrientation);
      window.removeEventListener('orientationchange', handleResizeOrOrientation);
    };
  }, []);

  // Initialize permissions, audio context, models, and questions
  useEffect(() => {
    const initialize = async () => {
      console.log('Initializing ExamPage: webcam, microphone, models, and questions...');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        console.log('Media stream obtained:', stream);
        setHasCameraPermission(true);
        setHasMicPermission(true);

        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        if (audioContextRef.current.state === 'suspended') {
          const resumeAudio = async () => {
            await audioContextRef.current.resume();
            console.log('AudioContext resumed');
          };
          document.addEventListener('click', resumeAudio, { once: true });
        }

        // Load models locally with detailed error handling
        try {
          console.log('Attempting to load face-api.js models from /models...');
          await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
          console.log('Tiny face detector model loaded successfully.');
          await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
          console.log('Face landmark 68 model loaded successfully.');
          console.log('face-api.js models loaded successfully from /models');
        } catch (error) {
          console.error('Failed to load models from /models:', error);
          console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
          });
          setModelLoadError('Failed to load face detection models. Face detection disabled.');
          triggerAlert('⚠️ Failed to load face detection models. Face detection disabled.', 'ModelLoadError');
        }
        setModelsLoading(false);

        // Initialize questions
        const stored = localStorage.getItem("questions");
        let loadedQuestions = [];
        if (stored) {
          try {
            loadedQuestions = JSON.parse(stored);
          } catch (err) {
            console.error("Error parsing questions:", err);
          }
        }
        if (!loadedQuestions.length) {
          loadedQuestions = questionBank
            .map((q) => ({
              ...q,
              options: q.options ? [...q.options].sort(() => Math.random() - 0.5) : undefined,
              correctAnswer: q.answer,
            }))
            .sort(() => Math.random() - 0.5)
            .slice(0, examSettings.questionCount);
        }
        setQuestions(loadedQuestions);
        console.log('Questions initialized:', loadedQuestions);
      } catch (error) {
        console.error('Media permission error:', error);
        setHasCameraPermission(false);
        setHasMicPermission(false);
        setCameraError('Camera and microphone access required. Please enable permissions.');
        setModelsLoading(false);
      }
    };
    initialize();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
      if (faceDetectionIntervalRef.current) clearInterval(faceDetectionIntervalRef.current);
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      if (webcamRef.current?.video?.srcObject) {
        webcamRef.current.video.srcObject.getTracks().forEach(track => track.stop());
        webcamRef.current.video.srcObject = null;
      }
    };
  }, []);

  // Timer with scheduling integration
  useEffect(() => {
    const selectedSlots = JSON.parse(localStorage.getItem('selectedTimeSlot')) || [];
    const matchedEntry = selectedSlots.find(
      (entry) => Array.isArray(entry.userId) && entry.userId.includes(userDetails.id)
    );

    if (!matchedEntry) {
      console.log('No valid time slot found, redirecting to /student');
      navigate('/student', { state: userDetails, replace: true });
      return;
    }

    const scheduledTime = new Date(`${matchedEntry.date} ${matchedEntry.time}`);
    const windowEnd = new Date(scheduledTime.getTime() + 30 * 60000);

    timerRef.current = setInterval(() => {
      const now = new Date().getTime();
      const remaining = targetDateRef.current - now;

      console.log('Timer:', { now, remaining, sessionTime, windowEnd: windowEnd.getTime() });

      if (now > windowEnd || remaining <= 0) {
        clearInterval(timerRef.current);
        setSessionTime(examSettings.duration);
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance('Time is up. Submitting your exam.');
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
        submitTest();
      } else {
        setSessionTime((prev) => prev + 1);
      }
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [navigate, userDetails, examSettings.duration]);

  // Face detection monitoring with violation reset (only face presence, more lenient)
  useEffect(() => {
    if (!proctoringActive || modelLoadError || !videoReady) {
      console.log('Proctoring not active or video not ready:', { proctoringActive, modelLoadError, videoReady });
      setFaceDetected(false);
      return;
    }

    const monitorFaces = async () => {
      if (!hasCameraPermission || examCompleted) {
        console.log('Skipping face detection:', { hasCameraPermission, examCompleted });
        return;
      }

      if (!webcamRef.current?.video?.srcObject) {
        console.error('Webcam stream not available');
        setFaceDetectionError('Webcam stream not available.');
        setFaceDetected(false);
        triggerAlert('⚠️ Webcam stream not available. Ensure camera is working.', 'FaceDetectionError');
        return;
      }

      const video = webcamRef.current.video;
      if (video.readyState !== 4) {
        console.log('Video not ready:', video.readyState);
        return;
      }

      const brightness = getAverageBrightness(video);
      console.log('Brightness level:', brightness);
      if (brightness !== null && brightness < BRIGHTNESS_THRESHOLD && !gracePeriod) {
        triggerAlert('⚠️ Lighting too low. Please improve room light.', 'Lighting');
      }

      try {
        const canvas = faceapi.createCanvasFromMedia(video);
        const displaySize = { width: video.videoWidth || videoConstraints.width, height: video.videoHeight || videoConstraints.height };
        faceapi.matchDimensions(canvas, displaySize);

        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.6 })); // Lowered threshold for better detection
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        const faceCount = resizedDetections.length;
        console.log('Face detections:', resizedDetections.map(d => ({ score: d._score, box: d.box })));

        setFaceDetectionBuffer((prev) => {
          const newBuffer = [...prev, faceCount > 0].slice(-FACE_DETECTION_BUFFER_SIZE); // Any face detection counts
          const faceDetectedRatio = newBuffer.filter(Boolean).length / newBuffer.length;
          const isFaceDetected = faceDetectedRatio >= FACE_DETECTION_BUFFER_THRESHOLD;
          setFaceDetected(isFaceDetected);
          console.log('Face detection buffer:', { buffer: newBuffer, ratio: faceDetectedRatio, isFaceDetected });

          // Reset FaceDetection violation if face is detected again
          if (isFaceDetected && warningLevels.FaceDetection > 0) {
            setWarningLevels((prev) => ({ ...prev, FaceDetection: 0 }));
            violationResetTime.current['FaceDetection'] = 0;
          }
          return newBuffer;
        });

        if (faceCount > 1 && !gracePeriod) {
          const newLevel = warningLevels.MultipleFaces + 1;
          setWarningLevels((prev) => ({ ...prev, MultipleFaces: newLevel }));
          triggerAlert('⚠️ Multiple faces detected! Only one person allowed in view.', 'MultipleFaces');
        } else if (faceCount === 0 && !gracePeriod && !faceDetected) {
          const newLevel = warningLevels.FaceDetection + 1;
          setWarningLevels((prev) => ({ ...prev, FaceDetection: newLevel }));
          triggerAlert('⚠️ Face not detected! Keep your face in view.', 'FaceDetection');
        }
      } catch (error) {
        console.error('Face detection error:', error);
        setFaceDetectionError('Face detection failed. Check camera and lighting.');
        triggerAlert('⚠️ Face detection error occurred. Ensure camera is working.', 'FaceDetectionError');
      }
    };

    const detectionInterval = window.innerWidth < 768 ? 2000 : 1000;
    faceDetectionIntervalRef.current = setInterval(monitorFaces, detectionInterval);
    return () => {
      clearInterval(faceDetectionIntervalRef.current);
      setFaceDetectionError(null);
      setWarningMessage('');
      setFaceDetectionBuffer([]);
    };
  }, [
    hasCameraPermission,
    examCompleted,
    gracePeriod,
    warningLevels,
    proctoringActive,
    modelLoadError,
    videoConstraints,
    videoReady,
    faceDetected,
  ]);

  // Audio monitoring with violation reset
  useEffect(() => {
    if (!proctoringActive || !hasMicPermission || examCompleted) {
      console.log('Skipping audio monitoring:', { proctoringActive, hasMicPermission, examCompleted });
      return;
    }

    let stream;
    const startAudioMonitoring = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('Audio stream obtained:', stream);
        const audioContext = audioContextRef.current;
        if (!audioContext) {
          console.error('Audio context not initialized');
          triggerAlert('Failed to initialize audio context.', 'AudioError');
          return;
        }
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
          console.log('AudioContext resumed for monitoring');
        }
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        source.connect(analyser);
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        let audioDuration = 0;
        let lastAudioTime = 0;
        let silenceCounter = 0;
        let whisperCounter = 0;

        audioIntervalRef.current = setInterval(() => {
          analyser.getByteFrequencyData(dataArray);
          const speechBins = dataArray.slice(0, 12);
          const avg = speechBins.reduce((a, b) => a + b, 0) / speechBins.length;
          const normalizedAvg = avg / 255;
          setAudioLevel(normalizedAvg);
          console.log('Audio level:', { normalizedAvg, audioDuration });

          const effectiveThreshold = AUDIO_THRESHOLD + (normalizedAvg < 0.02 ? 0 : 0.02);

          if (normalizedAvg > effectiveThreshold && !gracePeriod) {
            const now = Date.now();
            audioDuration += lastAudioTime ? now - lastAudioTime : 0;
            lastAudioTime = now;
            silenceCounter = 0;
            whisperCounter = 0;

            if (audioDuration > 3000) {
              const newLevel = warningLevels.Audio + 1;
              setWarningLevels((prev) => ({ ...prev, Audio: newLevel }));
              triggerAlert('⚠️ Sustained audio activity detected!', 'Audio');
            }
          } else if (normalizedAvg > 0.03 && normalizedAvg <= effectiveThreshold && !gracePeriod) {
            whisperCounter++;
            silenceCounter = 0;
            if (whisperCounter >= 3) {
              const newLevel = warningLevels.Audio + 1;
              setWarningLevels((prev) => ({ ...prev, Audio: newLevel }));
              triggerAlert('⚠️ Whispering detected!', 'Audio');
              whisperCounter = 0;
            }
          } else {
            silenceCounter++;
            whisperCounter = 0;
            audioDuration = 0;
            lastAudioTime = 0;
            if (silenceCounter >= 5) {
              silenceCounter = 0;
              // Reset Audio violation if silent for a while
              if (warningLevels.Audio > 0) {
                setWarningLevels((prev) => ({ ...prev, Audio: 0 }));
                violationResetTime.current['Audio'] = 0;
              }
            }
          }
        }, 250);

        return () => {
          clearInterval(audioIntervalRef.current);
          source.disconnect();
          if (stream) stream.getTracks().forEach(track => track.stop());
        };
      } catch (error) {
        console.error('Audio monitoring error:', error);
        triggerAlert('Failed to start audio monitoring. Ensure microphone permissions are granted.', 'AudioError');
      }
    };
    startAudioMonitoring();

    return () => {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [hasMicPermission, examCompleted, gracePeriod, warningLevels, proctoringActive]);

  // Tab/window switching with violation reset
  useEffect(() => {
    if (!proctoringActive) return;

    const handleVisibilityChange = () => {
      if (examCompleted || gracePeriod) return;

      const now = Date.now();
      console.log('Visibility change:', { visibilityState: document.visibilityState });
      if (document.visibilityState === 'hidden') {
        const newLevel = warningLevels.TabSwitch + 1;
        setWarningLevels((prev) => ({ ...prev, TabSwitch: newLevel }));
        triggerAlert('⚠️ Tab or window switched! Stay in the exam.', 'TabSwitch');
      } else if (warningLevels.TabSwitch > 0) {
        setWarningLevels((prev) => ({ ...prev, TabSwitch: 0 }));
        violationResetTime.current['TabSwitch'] = 0;
      }
      lastStateChange.current = now;
    };

    const handleBlur = () => {
      if (examCompleted || gracePeriod) return;
      const now = Date.now();
      if (now - lastStateChange.current > APP_SWITCH_THRESHOLD) {
        const newLevel = warningLevels.TabSwitch + 1;
        setWarningLevels((prev) => ({ ...prev, TabSwitch: newLevel }));
        triggerAlert('⚠️ Window focus lost! Stay in the exam.', 'TabSwitch');
      }
      lastStateChange.current = now;
    };

    const handleFocus = () => {
      if (examCompleted || gracePeriod) return;
      const now = Date.now();
      if (now - lastStateChange.current > APP_SWITCH_THRESHOLD) {
        console.log('Window focus regained');
        lastStateChange.current = now;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [examCompleted, gracePeriod, warningLevels, proctoringActive, navigate]);

  // Screenshot logging
  useEffect(() => {
    if (!proctoringActive || examCompleted) return;

    const screenshotInterval = setInterval(() => {
      setCheatLogs((logs) => [
        ...logs,
        { message: 'Screenshot captured', timestamp: new Date().toLocaleString(), type: 'Screenshot' },
      ]);
    }, 30000);
    return () => clearInterval(screenshotInterval);
  }, [examCompleted, proctoringActive]);

  // Select an answer
  const selectOption = (qIndex, option) => {
    setAnswers((prev) => ({ ...prev, [qIndex]: option }));
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(`Selected ${option}`);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  // Run code
  const runCode = (qIndex, code) => {
    try {
      const func = new Function(`return (function() { ${code} })();`);
      const output = func();
      const q = questions[qIndex];
      let testResults = 'No test cases available';
      if (q.testCases) {
        testResults = q.testCases.map((test, i) => {
          const input = JSON.parse(test.input);
          const expected = JSON.parse(test.output);
          const testFunc = new Function('input', `return (function() { ${code} })(input);`);
          const result = testFunc(input);
          return `Test ${i + 1}: ${result === expected ? 'Passed' : 'Failed'}`;
        }).join('\n');
      }
      setCodeOutput((prev) => ({ ...prev, [qIndex]: `Output: ${output}\n${testResults}` }));
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`Code executed. ${testResults}`);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      setCodeOutput((prev) => ({ ...prev, [qIndex]: `Error: ${error.message}` }));
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`Code execution failed: ${error.message}`);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Detect copy-paste
  const handleCodeInputChange = (qIndex, text) => {
    const now = Date.now();
    const inputLength = text.length - (answers[qIndex]?.length || 0);
    if (inputLength > 10 && now - lastInputTime.current < 300 && !gracePeriod && proctoringActive) {
      if (!lastAlertTime.current['CopyPaste'] || now - lastAlertTime.current['CopyPaste'] >= ALERT_DEBOUNCE_MS) {
        triggerAlert('⚠️ Possible copy-paste detected in code input!', 'CopyPaste');
        lastAlertTime.current['CopyPaste'] = now;
      }
    }
    lastInputTime.current = now;
    selectOption(qIndex, text);
  };

  // Read question aloud
  const readQuestion = () => {
    const q = questions[currentQuestion];
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      `${q.question}. ${q.options ? 'Options: ' + q.options.join(', ') : ''}`
    );
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  // Navigate questions
  const goToPrevious = () => setCurrentQuestion((prev) => Math.max(0, prev - 1));
  const goToNext = () => setCurrentQuestion((prev) => Math.min(questions.length - 1, prev + 1));

  // Submit test
  const submitTest = (terminated = false) => {
    setProctoringActive(false);
    setShowSpinner(true);
    setShowModal(true);

    setTimeout(() => {
      setShowSpinner(false);
      setShowModal(false);

      let score = 0;
      questions.forEach((q, index) => {
        if (q.type === 'Coding') {
          if (q.testCases) {
            let allPassed = true;
            try {
              q.testCases.forEach((test) => {
                const input = JSON.parse(test.input);
                const expected = JSON.parse(test.output);
                const testFunc = new Function('input', `return (function() { ${answers[index] || ''} })(input);`);
                const result = testFunc(input);
                if (result !== expected) allPassed = false;
              });
              if (allPassed) score++;
            } catch (error) {
              console.error('Coding question error:', error);
            }
          }
        } else if (answers[index] && answers[index].toLowerCase() === q.correctAnswer.toLowerCase()) {
          score++;
        }
      });

      const unanswered = questions.length - Object.keys(answers).length;
      if (!terminated && !reviewMode && unanswered > 0) {
        triggerAlert(`You have ${unanswered} unanswered question(s). Review answers?`, 'UnansweredQuestions');
        setReviewMode(true);
        setProctoringActive(true);
      } else {
        finalizeSubmission(score, terminated);
      }
    }, 2000);
  };

  // Finalize submission
  const finalizeSubmission = (score, terminated) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      terminated
        ? 'Test terminated due to violations.'
        : `Test completed. Your score is ${score} out of ${questions.length}.`
    );
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);

    const newEntry = {
      id: userDetails.id || 'Unknown',
      score,
    };
    let existingData = JSON.parse(localStorage.getItem("Result")) || [];
    existingData.push(newEntry);
    localStorage.setItem("Result", JSON.stringify(existingData));

    const categoryScores = {};
    questions.forEach((q, index) => {
      const cat = q.category;
      if (!categoryScores[cat]) categoryScores[cat] = { correct: 0, total: 0 };
      categoryScores[cat].total++;
      if (q.type === 'Coding') {
        if (q.testCases) {
          let allPassed = true;
          try {
            q.testCases.forEach((test) => {
              const input = JSON.parse(test.input);
              const expected = JSON.parse(test.output);
              const testFunc = new Function('input', `return (function() { ${answers[index] || ''} })(input);`);
              const result = testFunc(input);
              if (result !== expected) allPassed = false;
            });
            if (allPassed) categoryScores[cat].correct++;
          } catch (error) {
            console.error('Coding scoring error:', error);
          }
        }
      } else if (answers[index] && answers[index].toLowerCase() === q.correctAnswer.toLowerCase()) {
        categoryScores[cat].correct++;
      }
    });

    const report = `
      Exam Report
      Candidate ID: ${userDetails.id || 'Unknown'}
      Status: ${terminated ? 'Terminated' : 'Completed'}
      Score: ${score}/${questions.length}
      Time Taken: ${formatTime(sessionTime)}
      Violations: ${cheatCount}
      Category Performance: ${Object.entries(categoryScores)
        .map(([cat, { correct, total }]) => `\n- ${cat}: ${correct}/${total}`)
        .join('')}
      Code Outputs: ${Object.entries(codeOutput)
        .map(([index, output]) => `\n- Question ${parseInt(index) + 1}: ${output}`)
        .join('')}
      Violation Details: ${cheatLogs.map((log) => `\n- ${log.timestamp}: ${log.message} (${log.type})`).join('')}
    `;
    setExamReport(report);
    const historyEntry = {
      id: Date.now(),
      candidateId: userDetails.id || 'Unknown',
      score,
      total: questions.length,
      time: sessionTime,
      violations: cheatCount,
      categoryScores,
    };
    setExamHistory((prev) => {
      const newHistory = [...prev, historyEntry];
      localStorage.setItem('exam_history', JSON.stringify(newHistory));
      return newHistory;
    });
    setExamCompleted(true);
    localStorage.removeItem('exam_progress');
    localStorage.setItem(`violation_log_${Date.now()}`, JSON.stringify(cheatLogs));
  };

  // Format time
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Reset exam
  const resetExam = () => {
    navigate('/student', { state: userDetails, replace: true });
  };

  // Fallback UI for debugging
  if (!modelsLoading && hasCameraPermission === null && hasMicPermission === null) {
    console.log('State:', { modelsLoading, hasCameraPermission, hasMicPermission, examCompleted, reviewMode, videoReady });
    return (
      <Centered>
        <p>Initializing exam... Please ensure camera and microphone permissions are granted.</p>
      </Centered>
    );
  }

  if (modelsLoading) {
    console.log('Loading models...');
    return (
      <Centered>
        <Spinner />
        <p>Loading face detection models...</p>
      </Centered>
    );
  }

  if (hasCameraPermission === false || hasMicPermission === false) {
    console.log('Permission denied:', { hasCameraPermission, hasMicPermission });
    return (
      <Centered>
        <CameraContainer>
          <WebcamStyled
            audio={false}
            ref={webcamRef}
            videoConstraints={videoConstraints}
            onUserMedia={() => console.log('Webcam stream started successfully')}
            onUserMediaError={(error) => {
              console.error('Webcam error:', error);
              setCameraError('Failed to access webcam. Ensure camera permissions are granted.');
            }}
            onLoadedMetadata={() => {
              console.log('Video metadata loaded');
              setVideoReady(true);
            }}
          />
          {cameraError && <CameraError>{cameraError}</CameraError>}
          {modelLoadError && <CameraError>{modelLoadError}</CameraError>}
          <Overlay>
            <FaceStatus>{faceDetected ? '✅ Face Detected' : '❌ Face Not Detected'}</FaceStatus>
            {faceDetectionError && <FaceError>{faceDetectionError}</FaceError>}
            <CheatCount>Violations: {cheatCount}/{examSettings.maxViolations}</CheatCount>
            <AudioLevel>Audio Level: {(audioLevel * 100).toFixed(0)}%</AudioLevel>
          </Overlay>
        </CameraContainer>
        <p>No access to camera or microphone. Please enable permissions and refresh.</p>
        <StartButton onClick={() => window.location.reload()}>Retry</StartButton>
      </Centered>
    );
  }

  if (examCompleted) {
    console.log('Exam completed:', { examReport, examHistory });
    return (
      <Centered>
        <WelcomeTitle>Exam Completed</WelcomeTitle>
        <ReportContainer>
          <ReportText>{examReport}</ReportText>
          <HistoryTitle>Exam History</HistoryTitle>
          {examHistory.map((exam) => (
            <HistoryText key={exam.id}>
              ID: {exam.candidateId} - Score: {exam.score}/{exam.total}, Time: {formatTime(exam.time)}, Violations: {exam.violations}
              {Object.entries(exam.categoryScores)
                .map(([cat, { correct, total }]) => `\n  ${cat}: ${correct}/${total}`)
                .join('')}
            </HistoryText>
          ))}
        </ReportContainer>
        <StartButton onClick={resetExam}>Return to Student Page</StartButton>
      </Centered>
    );
  }

  if (reviewMode) {
    console.log('Review mode:', { answers, codeOutput });
    return (
      <Container>
        <Header>
          <HeaderText>Review Answers</HeaderText>
          <TimerText>
            Time: {formatTime(sessionTime)} / {formatTime(examSettings.duration)}
          </TimerText>
        </Header>
        <CameraContainer>
          <WebcamStyled
            audio={false}
            ref={webcamRef}
            videoConstraints={videoConstraints}
            onUserMedia={() => console.log('Webcam stream started successfully')}
            onUserMediaError={(error) => {
              console.error('Webcam error:', error);
              setCameraError('Failed to access webcam. Ensure camera permissions are granted.');
            }}
            onLoadedMetadata={() => {
              console.log('Video metadata loaded');
              setVideoReady(true);
            }}
          />
          {cameraError && <CameraError>{cameraError}</CameraError>}
          {modelLoadError && <CameraError>{modelLoadError}</CameraError>}
          <Overlay>
            <FaceStatus>{faceDetected ? '✅ Face Detected' : '❌ Face Not Detected'}</FaceStatus>
            {faceDetectionError && <FaceError>{faceDetectionError}</FaceError>}
            <CheatCount>Violations: {cheatCount}/{examSettings.maxViolations}</CheatCount>
            <AudioLevel>Audio Level: {(audioLevel * 100).toFixed(0)}%</AudioLevel>
          </Overlay>
        </CameraContainer>
        <TestContainer>
          {questions.map((q, idx) => (
            <QuestionCard key={q.id}>
              <QuestionText>
                Q{idx + 1}: {q.question} ({q.category}, {q.difficulty})
              </QuestionText>
              {q.options ? (
                q.options.map((opt, i) => (
                  <ChoiceButton
                    key={i}
                    selected={answers[idx] === opt}
                    disabled={answers[idx] && answers[idx] !== opt}
                    onClick={() => selectOption(idx, opt)}
                  >
                    {String.fromCharCode(97 + i)}. {opt}
                  </ChoiceButton>
                ))
              ) : (
                <Input
                  value={answers[idx] || ''}
                  onChange={(e) => handleCodeInputChange(idx, e.target.value)}
                  placeholder={q.type === 'Coding' ? 'Enter JavaScript code' : 'Enter your answer'}
                  style={q.type === 'Coding' ? { fontFamily: 'monospace', minHeight: '80px' } : {}}
                />
              )}
              {q.type === 'Coding' && (
                <RunButton onClick={() => runCode(idx, answers[idx] || '')}>Run Code</RunButton>
              )}
              {codeOutput[idx] && <OutputText>{codeOutput[idx]}</OutputText>}
              {examCompleted && (
                <div
                  style={{
                    fontWeight: 'bold',
                    marginTop: '10px',
                    color: answers[idx] === q.correctAnswer ? 'green' : 'red',
                  }}
                >
                  {answers[idx] === q.correctAnswer
                    ? '✅ Correct'
                    : `❌ Incorrect. Correct: ${q.correctAnswer}`}
                </div>
              )}
            </QuestionCard>
          ))}
          <SubmitBtn onClick={() => submitTest()}>Submit Exam</SubmitBtn>
        </TestContainer>
        <ModalContainer $show={showModal}>
          <ModalView>
            <RotatingLines
              visible={showSpinner}
              height="80"
              width="80"
              color="#1c3681"
              strokeWidth="5"
              animationDuration="0.75"
              ariaLabel="loading"
            />
            {showSpinner && (
              <ModalText style={{ marginTop: '20px', fontWeight: 'bold', color: '#1c3681' }}>
                Evaluating your results
              </ModalText>
            )}
          </ModalView>
        </ModalContainer>
      </Container>
    );
  }

  // Main exam interface
  console.log('Rendering main exam interface:', { currentQuestion, questions: questions.length, proctoringActive });
  return (
    <Container>
      {currentAlert && (
        <WarningBanner>
          <WarningText>{currentAlert.message}</WarningText>
          <WarningDetails>Type: {currentAlert.violationType} | Time: {new Date(currentAlert.timestamp).toLocaleTimeString()}</WarningDetails>
          <DismissButton onClick={() => setCurrentAlert(null)}>Dismiss</DismissButton>
        </WarningBanner>
      )}
      <Header>
        <HeaderText>JavaScript Quiz</HeaderText>
        <TimerText>
          Time: {formatTime(sessionTime)} / {formatTime(examSettings.duration)}
        </TimerText>
      </Header>
      <CameraContainer>
        <WebcamStyled
          audio={false}
          ref={webcamRef}
          videoConstraints={videoConstraints}
          onUserMedia={() => console.log('Webcam stream started successfully')}
          onUserMediaError={(error) => {
            console.error('Webcam error:', error);
            setCameraError('Failed to access webcam. Ensure camera permissions are granted.');
          }}
          onLoadedMetadata={() => {
            console.log('Video metadata loaded');
            setVideoReady(true);
          }}
        />
        {cameraError && <CameraError>{cameraError}</CameraError>}
        {modelLoadError && <CameraError>{modelLoadError}</CameraError>}
        <Overlay>
          <FaceStatus>{faceDetected ? '✅ Face Detected' : '❌ Face Not Detected'}</FaceStatus>
          {faceDetectionError && <FaceError>{faceDetectionError}</FaceError>}
          <CheatCount>Violations: {cheatCount}/{examSettings.maxViolations}</CheatCount>
          <AudioLevel>Audio Level: {(audioLevel * 100).toFixed(0)}%</AudioLevel>
        </Overlay>
      </CameraContainer>
      <TestContainer>
        <QuestionCard>
          <ProgressText>Question {currentQuestion + 1} of {questions.length}</ProgressText>
          <QuestionText>
            Q{currentQuestion + 1}. {questions[currentQuestion].question} ({questions[currentQuestion].category},{' '}
            {questions[currentQuestion].difficulty})
          </QuestionText>
          {questions[currentQuestion].options ? (
            questions[currentQuestion].options.map((opt, i) => (
              <ChoiceButton
                key={i}
                selected={answers[currentQuestion] === opt}
                disabled={answers[currentQuestion] && answers[currentQuestion] !== opt}
                onClick={() => selectOption(currentQuestion, opt)}
              >
                {String.fromCharCode(97 + i)}. {opt}
              </ChoiceButton>
            ))
          ) : (
            <Input
              value={answers[currentQuestion] || ''}
              onChange={(e) => handleCodeInputChange(currentQuestion, e.target.value)}
              placeholder={questions[currentQuestion].type === 'Coding' ? 'Enter JavaScript code' : 'Enter your answer'}
              style={questions[currentQuestion].type === 'Coding' ? { fontFamily: 'monospace', minHeight: '80px' } : {}}
            />
          )}
          {questions[currentQuestion].type === 'Coding' && (
            <RunButton onClick={() => runCode(currentQuestion, answers[currentQuestion] || '')}>
              Run Code
            </RunButton>
          )}
          {codeOutput[currentQuestion] && <OutputText>{codeOutput[currentQuestion]}</OutputText>}
          <ReadButton onClick={readQuestion}>Read Aloud</ReadButton>
          <NavContainer>
            <NavButton disabled={currentQuestion === 0} onClick={goToPrevious}>
              Previous
            </NavButton>
            <NavButton disabled={currentQuestion === questions.length - 1} onClick={goToNext}>
              Next
            </NavButton>
          </NavContainer>
        </QuestionCard>
        <SubmitBtn onClick={() => submitTest()}>Submit Exam</SubmitBtn>
      </TestContainer>
      <AlertLogContainer>
        <AlertLogTitle>Alert History</AlertLogTitle>
        {alertLogs.map((log, index) => (
          <AlertLogEntry key={index}>
            {new Date(log.timestamp).toLocaleTimeString()} - {log.message} ({log.violationType})
          </AlertLogEntry>
        ))}
      </AlertLogContainer>
      {modalVisible && (
        <ModalContainer $show={true}>
          <ModalView>
            <ModalTitle>Exam Rules</ModalTitle>
            <ModalText>
              - Keep your face visible and steady in the camera at all times.<br />
              - Only one person should be in view.<br />
              - Do not switch tabs or minimize the browser.<br />
              - Avoid making loud sounds during the exam.<br />
              - No copy-pasting in coding questions.<br />
              - Maximum of {examSettings.maxViolations} violations allowed.<br />
              - Complete the test within {formatTime(examSettings.duration)}.<br />
              - Violations: {cheatCount} detected so far.
            </ModalText>
            <Button
              onClick={() => {
                setModalVisible(false);
                setProctoringActive(true);
                setGracePeriod(true);
                setTimeout(() => {
                  setGracePeriod(false);
                  console.log('Grace period ended');
                }, GRACE_PERIOD_MS);
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance('Exam started. Good luck!');
                utterance.lang = 'en-US';
                window.speechSynthesis.speak(utterance);
              }}
            >
              Start Exam
            </Button>
          </ModalView>
        </ModalContainer>
      )}
      <ModalContainer $show={showModal}>
        <ModalView>
          <RotatingLines
            visible={showSpinner}
            height="80"
            width="80"
            color="#1c3681"
            strokeWidth="5"
            animationDuration="0.75"
            ariaLabel="loading"
          />
          {showSpinner && (
            <ModalText style={{ marginTop: '20px', fontWeight: 'bold', color: '#1c3681' }}>
              Evaluating your results
            </ModalText>
          )}
        </ModalView>
      </ModalContainer>
    </Container>
  );
};

// Styled components
const flash = keyframes`
  0% { background-color: #ffcc00; }
  50% { background-color: #ff9900; }
  100% { background-color: #ffcc00; }
`;

const Container = styled.div`
  max-width: 800px;
  margin: 40px auto;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  padding: 20px;
  background-color: #f4f8fc;
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  min-height: 100vh;
`;

const Centered = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f4f8fc;
  padding: 20px;
`;

const Spinner = styled.div`
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1c3681;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: 20px;
  background-color: #1c3681;
  padding: 15px;
  border-radius: 10px;
`;

const HeaderText = styled.h2`
  color: #fff;
  font-size: 20px;
  font-weight: 700;
`;

const TimerText = styled.p`
  color: #fff;
  font-size: 16px;
  font-weight: 500;
  margin-top: 5px;
`;

const CameraContainer = styled.div`
  position: fixed;
  top: 80px;
  right: 10px;
  width: ${window.innerWidth < 768 ? '35vw' : '200px'};
  height: ${window.innerWidth < 768 ? '26vw' : '150px'};
  z-index: 1000;

  @media (max-width: 768px) {
    top: 10px;
    right: 5px;
    width: 30vw;
    height: 22.5vw;
  }

  @media (max-width: 480px) {
    width: 40vw;
    height: 30vw;
  }
`;

const WebcamStyled = styled(Webcam)`
  width: 100%;
  height: 100%;
  border-radius: 8px;
  border: 2px solid #fff;
`;

const CameraError = styled.p`
  color: #c62828;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  margin-top: 5px;
`;

const FaceError = styled.p`
  color: #ffcc00;
  font-size: 10px;
  font-weight: 600;
  margin-top: 4px;
`;

const Overlay = styled.div`
  position: fixed;
  top: ${(window.innerWidth < 768 ? 'calc(10px + 22.5vw)' : '230px')};
  right: 10px;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 8px;
  border-radius: 8px;
  text-align: center;
  width: ${(window.innerWidth < 768 ? '30vw' : '200px')};
  z-index: 1000;

  @media (max-width: 768px) {
    right: 5px;
    width: 30vw;
  }

  @media (max-width: 480px) {
    width: 40vw;
  }
`;

const FaceStatus = styled.p`
  color: #fff;
  font-size: 12px;
  font-weight: 600;
`;

const CheatCount = styled.p`
  color: #fff;
  font-size: 10px;
  margin-top: 4px;
`;

const AudioLevel = styled.p`
  color: #fff;
  font-size: 10px;
  margin-top: 4px;
`;

const TestContainer = styled.div`
  margin-top: 80px;
  padding: 15px;
`;

const QuestionCard = styled.div`
  background-color: #fff;
  border-radius: 12px;
  padding: 20px;
  margin: 20px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const ProgressText = styled.p`
  font-size: 14px;
  color: #1c3681;
  font-weight: 600;
  margin-bottom: 10px;
`;

const QuestionText = styled.div`
  font-weight: 600;
  font-size: 18px;
  margin-bottom: 15px;
`;

const ChoiceButton = styled.button`
  background-color: ${(props) => (props.selected ? '#1c3681' : props.disabled ? '#f0f0f0' : '#f1f1f1')};
  color: ${(props) => (props.selected ? '#fff' : '#333')};
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 10px 18px;
  margin: 8px 12px 8px 0;
  cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
  transition: all 0.3s ease;
  font-weight: 500;
  box-shadow: ${(props) => (props.selected ? '0 4px 8px rgba(28,54,129,0.3)' : 'none')};
  outline: none;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  margin-bottom: 10px;
  font-size: 16px;
`;

const OutputText = styled.pre`
  font-size: 12px;
  color: #333;
  margin-top: 10px;
  font-family: monospace;
`;

const RunButton = styled.button`
  background-color: #10b981;
  color: #fff;
  padding: 10px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 10px;
`;

const ReadButton = styled.button`
  background-color: #6b7280;
  color: #fff;
  padding: 10px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 10px;
`;

const NavContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
`;

const NavButton = styled.button`
  background-color: ${(props) => (props.disabled ? '#a0aec0' : '#1c3681')};
  color: #fff;
  padding: 10px;
  border-radius: 6px;
  border: none;
  cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
  width: 45%;
  text-align: center;
  font-size: 14px;
`;

const SubmitBtn = styled.button`
  display: block;
  margin: 30px auto 10px;
  background-color: #1c3681;
  color: white;
  padding: 14px 36px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
`;

const WarningBanner = styled.div`
  position: fixed;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #ffcc00;
  animation: ${flash} 1s infinite;
  color: #000;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  z-index: 2000;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 90%;
  text-align: center;
`;

const WarningText = styled.p`
  margin: 0;
  font-size: 16px;
`;

const WarningDetails = styled.p`
  margin: 5px 0 10px;
  font-size: 12px;
  color: #333;
`;

const DismissButton = styled.button`
  background-color: #333;
  color: #fff;
  padding: 6px 12px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 12px;
`;

const ModalContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: ${({ $show }) => ($show ? 'flex' : 'none')};
  justify-content: center;
  align-items: center;
  z-index: 2000;
`;

const ModalView = styled.div`
  background-color: #fff;
  border-radius: 12px;
  padding: 20px;
  width: 85%;
  max-width: 500px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: #1c3681;
  margin-bottom: 15px;
`;

const ModalText = styled.p`
  font-size: 15px;
  color: #333;
  margin-bottom: 20px;
  line-height: 22px;
`;

const Button = styled.button`
  background-color: #1c3681;
  color: #fff;
  padding: 10px 20px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 16px;
`;

const WelcomeTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #1c3681;
  margin-bottom: 20px;
  text-align: center;
`;

const ReportContainer = styled.div`
  flex: 1;
  width: 100%;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 8px;
  margin-bottom: 20px;
  overflow-y: auto;
`;

const ReportText = styled.pre`
  font-size: 14px;
  color: #333;
  line-height: 20px;
`;

const HistoryTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #1c3681;
  margin: 20px 0 10px;
`;

const HistoryText = styled.p`
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
`;

const StartButton = styled.button`
  background-color: #1c3681;
  color: #fff;
  padding: 15px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 18px;
  font-weight: 600;
  width: 80%;
  margin-top: 10px;
`;

const AlertLogContainer = styled.div`
  margin-top: 20px;
  padding: 10px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-height: 150px;
  overflow-y: auto;
`;

const AlertLogTitle = styled.h3`
  font-size: 16px;
  color: #1c3681;
  margin-bottom: 10px;
`;

const AlertLogEntry = styled.p`
  font-size: 12px;
  color: #333;
  margin: 5px 0;
`;

export default DQuestions;