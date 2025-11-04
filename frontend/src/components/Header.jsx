import React, {useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext"; 

const Header = () => {
  const navigate = useNavigate();
  const { user, setUser } = useContext(AuthContext);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
    navigate("/login"); 
  };

  return (
    <header className="bg-gray-800 text-white shadow-md">
      <nav className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        
        <Link to="/" className="text-xl font-bold hover:text-gray-200">
          ReviewShield AI
        </Link>

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/admin")}
            className="bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-600"
          >
            Admin Dashboard
          </button>

          {user ? (
            <>
              <span className="text-sm font-medium">
                Welcome, <span className="text-blue-300">{user.username}</span>
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 px-3 py-1 rounded-md text-sm font-medium hover:bg-red-700"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="bg-green-600 px-3 py-1 rounded-md text-sm font-medium hover:bg-green-700"
            >
              Login
            </button>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
