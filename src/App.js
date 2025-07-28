import './App.css';

// import 'bootstrap/dist/css/bootstrap.min.css';
import { HashRouter, Route, Routes } from 'react-router-dom';
import Login from './login';
import FirstPage from './Admin/Firstpage';
import ATimeSlot from './Admin/ATimeslot';
import ExamPage from './Student/ExamPage';
import StudentPage from './Student/StudentPage';
import Questions from './Admin/Questions';
import DQuestions from './Student/DQuestions';
import AdminDashboard from './Admin/AdminDashboard';
import StudentDashBoard from './Student/StudentDashBoard';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path='/' element={<Login />} />
        <Route path='/firstPage' element={<FirstPage />} />
        <Route path='/firstPage/atimeslot' element={<ATimeSlot />} />
        <Route path='/studentpage' element={<StudentPage />} />
        <Route path='/studentpage/exampage' element={<ExamPage />} />
        <Route path='/dquestions' element={<DQuestions />} />
        <Route path='/questions' element={<Questions />} />
        <Route path='/admindashboard' element={<AdminDashboard />} />
        <Route path='/studentDashboard' element={<StudentDashBoard />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
