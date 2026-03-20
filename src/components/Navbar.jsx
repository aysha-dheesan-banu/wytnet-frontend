import { Link, useNavigate } from 'react-router-dom';
import { removeToken } from '../utils/auth';

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    removeToken();
    navigate('/');
  };

  return (
    <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc', display: 'flex', justifyContent: 'space-between' }}>
      <div>
        <Link to="/dashboard" style={{ marginRight: '1rem', fontWeight: 'bold', textDecoration: 'none' }}>Wytnet</Link>
      </div>
      <div>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;
