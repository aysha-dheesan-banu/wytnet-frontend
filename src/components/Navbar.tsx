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
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <img src="/favicon.svg" alt="WytNet Logo" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
        <Link to="/dashboard" style={{ fontWeight: 'bold', textDecoration: 'none', color: '#5c59f2' }}>Wytnet</Link>
      </div>
      <div>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;
