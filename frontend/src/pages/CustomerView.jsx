import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductDetails from "../components/ProductDetails";
import CustomerReviews from "../components/CustomerReviews";
import ReviewForm from "../components/ReviewForm";
const username = localStorage.getItem("username");

const API_BASE_URL = "http://localhost:5000";

const CustomerView = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch product details by ID
  useEffect(() => {
    const fetchProductAndReviews = async () => {
      try {
        const productResponse = await axios.get(`${API_BASE_URL}/api/products/${id}`);
        setProduct(productResponse.data);

        // Fetch only genuine reviews
        const reviewsResponse = await axios.get(`${API_BASE_URL}/api/products/${id}/reviews`);
        setReviews(reviewsResponse.data);
      } catch (err) {
        console.error("Error fetching product or reviews:", err);
        setError("Failed to load product details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProductAndReviews();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center text-gray-400">
        Loading product details...
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex justify-center items-center text-red-400">
        {error || "Product not found"}
      </div>
    );
  }
  const handleSubmitReview = async () => {
  await axios.post(`${API_BASE_URL}/api/add-review/${productId}`, {
    username,  // ← include this
    review_text,
    rating,
  });
};

  return (
    <div className="min-h-screen bg-gray-900 text-gray-300 font-sans">
      <main className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <section className="mb-12">
          <ProductDetails product={product} />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* <div className="lg:col-span-2">
            <CustomerReviews reviews={reviews} />
          </div> */}
          {/* <div>
            <ReviewForm productId={product._id} />
          </div> */}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default CustomerView;



