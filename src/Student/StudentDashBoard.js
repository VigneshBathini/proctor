import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { useNavigate ,useLocation} from "react-router-dom";

const StudentDashBoard = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [mediaStream, setMediaStream] = useState(null);
  const [photo, setPhoto] = useState(null);

   const location = useLocation();
  const userDetails = location.state;

  // Personal details state
  const [form, setForm] = useState({
    name: "",
    id: "",
    email: "",
    mobile: "",
    course: "",
    gender: "",
  });

  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.ssdMobilenetv1.loadFromUri("/models/ssd_mobilenetv1");
        await faceapi.nets.faceLandmark68Net.loadFromUri("/models/face_landmark_68");
        console.log("Models loaded");
      } catch (err) {
        console.error("Model loading error:", err);
      }
    };
    loadModels();
  }, []);

  const handleInput = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setMediaStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
        };
      }
    } catch (err) {
      alert("Please allow camera access.");
    }
  };

  const captureImage = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const context = canvas.getContext("2d");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageDataURL = canvas.toDataURL("image/png");
      setPhoto(imageDataURL);
    }
  };

  const stopWebcam = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleSubmit = () => {
    const { name, id, email, mobile, course, gender } = form;
    if (!name || !id || !email || !mobile || !course || !gender || !photo) {
      alert("Please fill in all details and capture a photo.");
      return;
    }
    stopWebcam();
    navigate("/studentpage",{ state: userDetails });
  };

  return (
    <div className="dashboard-container">
      <h2> Student Dashboard</h2>
      <div className="dashboard-card">
        <div className="form-section">
          <label>Name</label>
          <input name="name" value={form.name} onChange={handleInput} placeholder="Enter full name" />

          <label>ID</label>
          <input name="id" value={form.id} onChange={handleInput} placeholder="Enter student ID" />

          <label>Email</label>
          <input name="email" type="email" value={form.email} onChange={handleInput} placeholder="Enter email" />

          <label>Mobile</label>
          <input name="mobile" value={form.mobile} onChange={handleInput} placeholder="Enter mobile number" />

          <label>Course</label>
          <input name="course" value={form.course} onChange={handleInput} placeholder="Enter course name" />

          <label>Gender</label>
          <select name="gender" value={form.gender} onChange={handleInput}>
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="webcam-section">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="webcam-video"
          />
          <canvas ref={canvasRef} style={{ display: "none" }} />
          {photo && (
            <div className="photo-preview">
              <h4>Captured Photo</h4>
              <img src={photo} alt="Captured" />
            </div>
          )}
          <div className="cam-btns">
            <button className="btn-secondary" onClick={startWebcam}>
              Start Camera
            </button>
            <button className="btn-primary" onClick={captureImage}>
            Capture
            </button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: "2rem", textAlign: "center" }}>
        <button className="btn-proceed" onClick={handleSubmit}>
          Proceed to Exam
        </button>
      </div>
      {/* Stylish CSS */}
      <style>
        {`
          .dashboard-container {
  max-width: 960px;
  margin: 0 auto;
  padding: 3rem 1.5rem;
//   background: linear-gradient(145deg, #f5f7fa, #dbe3ec);
  border-radius: 24px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.08);
  font-family: 'Inter', sans-serif;
}

h2 {
  text-align: center;
  margin-bottom: 2.5rem;
  color: #172a45;
  font-size: 2.4rem;
  font-weight: 700;
}

.dashboard-card {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  background: #ffffff;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.05);
}

.form-section {
  flex: 1 1 360px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

label {
  font-weight: 600;
  color: #0d1b2a;
  font-size: 0.95rem;
  margin-bottom: 0.2rem;
}

input,
select {
  padding: 12px;
  font-size: 1rem;
  border: 1.6px solid #c0c7d6;
  border-radius: 8px;
  outline: none;
  transition: 0.2s ease;
  background-color: #f8fbff;
}

input:focus,
select:focus {
  border-color: #639dff;
  box-shadow: 0 0 0 3px rgba(99, 157, 255, 0.2);
}

.webcam-section {
  flex: 1 1 340px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.webcam-video {
  width: 100%;
  max-width: 340px;
  border-radius: 12px;
  border: 3px solid #070d14ff;
//   box-shadow: 0 2px 10px rgba(109, 162, 255, 0.2);
}

.photo-preview img {
  width: 180px;
  margin-top: 0.4rem;
  border-radius: 10px;
  border: 2px solid #78aaff;
  box-shadow: 0 2px 12px rgba(72, 126, 255, 0.3);
}

.photo-preview h4 {
  margin-bottom: 6px;
  font-size: 1.05rem;
  color: #243b55;
}

.cam-btns {
  display: flex;
  gap: 12px;
  margin-top: 0.7rem;
  flex-wrap: wrap;
  justify-content: center;
}

button {
  padding: 11px 18px;
  font-size: 1.05rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: 0.3s ease;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
}

.btn-primary {
  background: linear-gradient(135deg, #2b6cb0, #3182ce);
  color: white;
  border: none;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #1a4c8b, #255eac);
  box-shadow: 0 4px 18px rgba(49, 130, 206, 0.5);
}

.btn-secondary {
  background-color: #e7f0fa;
  color: #215e94;
  border: 1.5px solid #a3c1e2;
}

.btn-secondary:hover {
  background-color: #c8e2f8;
  color: #163c65;
}

.btn-proceed {
  background: linear-gradient(145deg, #3a8fd3);
  color: #fff;
  font-size: 1.1rem;
  padding: 12px 32px;
  margin-top: 1.5rem;
  border-radius: 10px;
}

.btn-proceed:hover {
  background: linear-gradient(145deg, #1799a1, #216bb4);
  box-shadow: 0 4px 22px rgba(58, 143, 211, 0.35);
}

@media (max-width: 900px) {
  .dashboard-card {
    flex-direction: column;
    align-items: center;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(25px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

        `}
      </style>
    </div>
  );
};

export default StudentDashBoard;
