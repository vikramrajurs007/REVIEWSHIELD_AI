import React, { useState } from "react";
import Star from "./Star";

const ReviewForm = ({ productId }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [loading, setLoading] = useState(false);

  const storedUser = localStorage.getItem("user");
  const username = storedUser ? JSON.parse(storedUser).username : "Anonymous User";

  const FLASK_API_URL = "http://127.0.0.1:5000/api/products";

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!rating || !reviewText.trim()) {
      alert("Please give a rating and write a review before submitting!");
      return;
    }

    setLoading(true);

    try {
      // 🧾 Step 1️⃣ — Build review payload
      const reviewData = {
        username,
        review_title: "Customer Review",
        review_text: reviewText,
        review_rating: rating,
        verified_purchase: true,
        avatarUrl: "https://placehold.co/100x100/4A5568/E0E7FF?text=AU",
      };

      // 🧠 Step 2️⃣ — Send to Flask API (handles ML + DB)
      const response = await fetch(`${FLASK_API_URL}/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewData),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to save review");

      alert("✅ Review added successfully!");
      console.log("Saved review:", result.review);

      // Reset form
      setRating(0);
      setReviewText("");
    } catch (error) {
      console.error("❌ Error submitting review:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
      <h3 className="text-2xl font-semibold text-white mb-4">Write a Review</h3>

      <form onSubmit={handleSubmit}>
        {/* ⭐ Rating */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">Your Rating</label>
          <div className="flex items-center">
            {[...Array(5)].map((_, index) => {
              const starValue = index + 1;
              return (
                <button
                  type="button"
                  key={starValue}
                  className="text-gray-500 focus:outline-none"
                  onClick={() => setRating(starValue)}
                  onMouseEnter={() => setHoverRating(starValue)}
                  onMouseLeave={() => setHoverRating(0)}
                >
                  <Star
                    className="w-6 h-6"
                    fill={(hoverRating || rating) >= starValue ? "rgb(234 179 8)" : "none"}
                    stroke={(hoverRating || rating) >= starValue ? "rgb(234 179 8)" : "currentColor"}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* 💬 Review Text */}
        <div className="mb-4">
          <label htmlFor="review" className="block text-sm font-medium text-gray-300 mb-2">
            Your Review
          </label>
          <textarea
            id="review"
            rows="4"
            className="w-full p-3 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Share your thoughts on this product..."
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
          />
        </div>

        {/* 🚀 Submit */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full px-4 py-2 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${
            loading
              ? "bg-gray-500 text-gray-200 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {loading ? "Submitting..." : "Submit Review"}
        </button>
      </form>
    </div>
  );
};

export default ReviewForm;

// import React, { useState } from "react";
// import Star from "./Star";

// const ReviewForm = ({ productId }) => {
//   const [rating, setRating] = useState(0);
//   const [hoverRating, setHoverRating] = useState(0);
//   const [reviewText, setReviewText] = useState("");
//   const [sentiment, setSentiment] = useState(null);
//   const [label, setLabel] = useState(null);
//   const [loading, setLoading] = useState(false);

//   // ✅ Read username from localStorage safely
//   const storedUser = localStorage.getItem("user");
//   const username = storedUser ? JSON.parse(storedUser).username : "Anonymous User";

//   const FLASK_API_URL = "http://127.0.0.1:5000/api/reviews/predict";
//   const NODE_API_URL = "http://127.0.0.1:5000/api/products";

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!rating || !reviewText.trim()) {
//       alert("Please give a rating and write a review before submitting!");
//       return;
//     }

//     setLoading(true);

//     try {
//       // Step 1️⃣ — Analyze review
//       const reviewData = {
//         category: "General",
//         product_description: "Sample product",
//         review_date: new Date().toISOString(),
//         review_rating: rating,
//         review_title: "Customer Review",
//         review_text: reviewText,
//         verified_purchase: true,
//       };

//       const response = await fetch(FLASK_API_URL, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(reviewData),
//       });

//       const result = await response.json();

//       if (!response.ok) throw new Error(result.message || "Failed to analyze review");

//       setSentiment(result.sentiment);
//       setLabel(result.label);

//       // Step 2️⃣ — Save to MongoDB
//       const saveReview = {
//         username, // ✅ send username explicitly
//         review_date: reviewData.review_date,
//         avatarUrl: "https://placehold.co/100x100/4A5568/E0E7FF?text=AU",
//         review_title: reviewData.review_title,
//         review_text: reviewData.review_text,
//         review_rating: reviewData.review_rating,
//         verified_purchase: reviewData.verified_purchase,
//         sentiment: result.sentiment,
//         length: result.length,
//         sim: result.sim,
//         deviation: result.deviation,
//         label: result.label,
//       };

//       const saveResponse = await fetch(`${NODE_API_URL}/${productId}/reviews`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(saveReview),
//       });

//       if (!saveResponse.ok) {
//         const errorData = await saveResponse.json();
//         throw new Error(errorData.message || "Failed to save review in MongoDB");
//       }

//       alert("✅ Review analyzed and saved successfully!");
//       setRating(0);
//       setReviewText("");
//       setSentiment(null);
//       setLabel(null);
//     } catch (error) {
//       console.error("Error submitting review:", error);
//       alert("Something went wrong. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
//       <h3 className="text-2xl font-semibold text-white mb-4">Write a Review</h3>

//       <form onSubmit={handleSubmit}>
//         {/* ⭐ Rating */}
//         <div className="mb-4">
//           <label className="block text-sm font-medium text-gray-300 mb-2">Your Rating</label>
//           <div className="flex items-center">
//             {[...Array(5)].map((_, index) => {
//               const starValue = index + 1;
//               return (
//                 <button
//                   type="button"
//                   key={starValue}
//                   className="text-gray-500 focus:outline-none"
//                   onClick={() => setRating(starValue)}
//                   onMouseEnter={() => setHoverRating(starValue)}
//                   onMouseLeave={() => setHoverRating(0)}
//                 >
//                   <Star
//                     className="w-6 h-6"
//                     fill={(hoverRating || rating) >= starValue ? "rgb(234 179 8)" : "none"}
//                     stroke={(hoverRating || rating) >= starValue ? "rgb(234 179 8)" : "currentColor"}
//                   />
//                 </button>
//               );
//             })}
//           </div>
//         </div>

//         {/* 💬 Review Text */}
//         <div className="mb-4">
//           <label htmlFor="review" className="block text-sm font-medium text-gray-300 mb-2">
//             Your Review
//           </label>
//           <textarea
//             id="review"
//             rows="4"
//             className="w-full p-3 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//             placeholder="Share your thoughts on this product..."
//             value={reviewText}
//             onChange={(e) => setReviewText(e.target.value)}
//           />
//         </div>

//         <button
//           type="submit"
//           disabled={loading}
//           className={`w-full px-4 py-2 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${
//             loading
//               ? "bg-gray-500 text-gray-200 cursor-not-allowed"
//               : "bg-blue-600 text-white hover:bg-blue-700"
//           }`}
//         >
//           {loading ? "Analyzing..." : "Submit Review"}
//         </button>
//       </form>

//       {/* 📊 ML Result */}
//       {label && (
//         <div
//           className={`mt-4 p-3 rounded-lg text-center font-semibold ${
//             label === "Genuine" ? "bg-green-700 text-white" : "bg-red-700 text-white"
//           }`}
//         >
//           <p>Sentiment Score: {sentiment}</p>
//           <p>Result: {label}</p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default ReviewForm;
























































// import React, { useState } from "react";
// import Star from "./Star";

// const ReviewForm = () => {
//   const [rating, setRating] = useState(0);
//   const [hoverRating, setHoverRating] = useState(0);
//   const [reviewText, setReviewText] = useState("");

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     console.log({ rating, reviewText });
//     alert("Thank you for your review!");
//     setRating(0);
//     setReviewText("");
//   };

//   return (
//     <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
//       <h3 className="text-2xl font-semibold text-white mb-4">Write a Review</h3>
//       <form onSubmit={handleSubmit}>
//         <div className="mb-4">
//           <label className="block text-sm font-medium text-gray-300 mb-2">
//             Your Rating
//           </label>
//           <div className="flex items-center">
//             {[...Array(5)].map((_, index) => {
//               const starValue = index + 1;
//               return (
//                 <button
//                   type="button"
//                   key={starValue}
//                   className="text-gray-500 focus:outline-none"
//                   onClick={() => setRating(starValue)}
//                   onMouseEnter={() => setHoverRating(starValue)}
//                   onMouseLeave={() => setHoverRating(0)}
//                 >
//                   <Star
//                     className="w-6 h-6"
//                     fill={(hoverRating || rating) >= starValue ? "rgb(234 179 8)" : "none"}
//                     stroke={(hoverRating || rating) >= starValue ? "rgb(234 179 8)" : "currentColor"}
//                   />
//                 </button>
//               );
//             })}
//           </div>
//         </div>
//         <div className="mb-4">
//           <label htmlFor="review" className="block text-sm font-medium text-gray-300 mb-2">
//             Your Review
//           </label>
//           <textarea
//             id="review"
//             rows="4"
//             className="w-full p-3 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//             placeholder="Share your thoughts on this product..."
//             value={reviewText}
//             onChange={(e) => setReviewText(e.target.value)}
//           />
//         </div>
//         <button
//           type="submit"
//           className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
//         >
//           Submit Review
//         </button>
//       </form>
//     </div>
//   );
// };

// export default ReviewForm;
