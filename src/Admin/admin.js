import react from 'react';
import { useNavigate } from 'react-router-dom';




const AdminPage = ()=>{
    const Naviagte  = useNavigate();

    const handleNav = ()=>{
Naviagte('Questions');
    }

    return(
        <div>
            <h3>Admin Page</h3>
            <button onClick={handleNav}>Naviagte to Create Questions Page</button>
        </div>
    )


}


export default AdminPage