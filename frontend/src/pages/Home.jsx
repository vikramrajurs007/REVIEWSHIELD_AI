import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import ProductGrid from "../components/ProductGrid";
import { AuthContext } from "../context/AuthContext";

const API_BASE_URL = "http://localhost:5000";

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useContext(AuthContext);  // ✅ access logged-in user
  const navigate = useNavigate();

  // ✅ Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  // ✅ Fetch products only if user is logged in
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = user?.token; 
        const response = await axios.get(`${API_BASE_URL}/api/products`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (Array.isArray(response.data)) {
          setProducts(response.data);
        } else {
          setProducts([]);
          setError("No products found");
        }
      } catch (err) {
        console.error("❌ Error fetching products:", err);
        setError("Failed to load products. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchProducts(); // only after login
  }, [user]);

  if (!user) {
    // ✅ Optional loading UI while redirecting
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        Redirecting to login...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 font-sans text-white">
      <main>
        <div className="text-center py-10">
          <h1 className="text-4xl font-extrabold">Featured Products</h1>
          <p className="mt-2 text-lg text-gray-400">
            Find the best electronics and gadgets.
          </p>
        </div>

        {loading ? (
          <div className="text-center text-gray-400">Loading products...</div>
        ) : error ? (
          <div className="text-center text-red-400">{error}</div>
        ) : (
          <ProductGrid products={products} />
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Home;

