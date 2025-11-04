import React, { useEffect, useState } from "react";
import ReviewCard from "./ReviewCard";
import ReviewForm from "./ReviewForm";

const ProductDetails = ({ product }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "INR",
  }).format(product.price);

  const NODE_API_BASE = "http://localhost:5000/api";

  // 🔍 Fetch reviews for the product
  const fetchReviews = async () => {
    if (!product?._id && !product?.id) return;

    try {
      const response = await fetch(
        `${NODE_API_BASE}/products/${product._id || product.id}/reviews`
      );

      if (!response.ok) throw new Error("Failed to fetch reviews");

      const data = await response.json();
      console.log("Fetched reviews:", data);

      // ✅ Normalize data
      const allReviews = Array.isArray(data)
        ? data
        : data.reviews || [];

      // ✅ Filter genuine reviews only
      const genuineReviews = allReviews.filter(
        (rev) => rev.label === "Genuine"
      );

      setReviews(genuineReviews);
    } catch (error) {
      console.error("❌ Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🌀 Fetch when product changes
  useEffect(() => {
    fetchReviews();
  }, [product]);

  // 🔁 Refresh list after a new review is added
  const handleReviewAdded = () => {
    fetchReviews();
  };

  return (
    <>
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/3">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-auto rounded-lg shadow-lg"
          />
        </div>

        {/* 📄 Product Info */}
        <div className="md:w-2/3 space-y-6">
          <div>
            <h1 className="text-4xl font-extrabold text-white">
              {product.name}
            </h1>
            <p className="text-lg text-gray-400 mt-1">
              {product.category}
            </p>
            <p className="text-3xl font-bold text-blue-400 my-4">
              {formattedPrice}
            </p>
            <p className="text-lg text-gray-300">
              {product.description}
            </p>
          </div>

          {/* 📝 Review Form */}
          <div>
            <ReviewForm
              productId={product._id || product.id}
              onReviewAdded={handleReviewAdded}
            />
          </div>
        </div>
      </div>

      {/* 💬 Reviews Section */}
      <div>
        <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
          Customer Reviews
        </h2>

        {loading && <p className="text-gray-400">Loading reviews...</p>}

        {!loading && reviews.length === 0 && (
          <p className="text-gray-400">No genuine reviews yet.</p>
        )}

        {!loading && reviews.length > 0 && (
          <div className="space-y-4">
            {reviews.map((rev, index) => (
              <ReviewCard
                key={rev._id || rev.id || `${product._id}-${index}`} // ✅ guaranteed unique
                review={rev}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default ProductDetails;
