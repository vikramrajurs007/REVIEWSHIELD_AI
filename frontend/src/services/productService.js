import { API_URL } from "../config";
// Fetch all products
export const fetchProducts = async () => {
  const res = await fetch(`${API_URL}/products`);
  return res.json();
};

// Add new product
export const addProduct = async (productData) => {
  const res = await fetch(`${API_URL}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(productData),
  });
  return res.json();
};

// Add review to a product
export const addReview = async (productId, reviewData) => {
  const res = await fetch(`${API_URL}/products/${productId}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(reviewData),
  });
  return res.json();
};

// Predict review authenticity
export const classifyReview = async (reviewData) => {
  const res = await fetch(`${API_URL}/reviews/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(reviewData),
  });
  return res.json();
};
