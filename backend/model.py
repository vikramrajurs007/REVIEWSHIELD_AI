# from flask import Flask, request, jsonify
# from flask_pymongo import PyMongo
# from datetime import datetime

# app = Flask(__name__)

# # MongoDB URI
# app.config["MONGO_URI"] = "mongodb://localhost:27017/reviewshield_ai"
# mongo = PyMongo(app)

# # -------------------------------
# # Helper function: create a product document
# # -------------------------------
# def create_product_doc(product_data):
#     reviews = []
#     for rev in product_data.get("reviews", []):
#         reviews.append({
#             "id": rev.get("id"),
#             "author": rev.get("author"),
#             "review_date": datetime.strptime(rev.get("review_date"), "%m/%d/%Y") if rev.get("review_date") else None,
#             "avatarUrl": rev.get("avatarUrl"),
#             "review_title": rev.get("review_title", ""),
#             "review_text": rev.get("review_text", rev.get("comment", "")),
#             "review_rating": rev.get("review_rating", rev.get("rating", 0)),
#             "verified_purchase": rev.get("verified_purchase", False),
#             "sentiment": rev.get("sentiment", None),
#             "length": rev.get("length", None),
#             "sim": rev.get("sim", None),
#             "deviation": rev.get("deviation", None),
#             "label": rev.get("label", "Pending")
#         })

#     return {
#         "id": product_data.get("id"),
#         "name": product_data.get("name"),
#         "category": product_data.get("category"),
#         "price": product_data.get("price"),
#         "description": product_data.get("description"),
#         "imageUrl": product_data.get("imageUrl"),
#         "reviews": reviews,
#         "createdAt": datetime.utcnow()
#     }

# # -------------------------------
# # API to add a new product
# # -------------------------------
# @app.route("/api/products", methods=["POST"])
# def add_product():
#     data = request.get_json()
#     if not data:
#         return jsonify({"error": "No data provided"}), 400

#     product_doc = create_product_doc(data)
#     result = mongo.db.products.insert_one(product_doc)
#     return jsonify({"message": "Product added", "id": str(result.inserted_id)}), 201

# # -------------------------------
# # API to get all products
# # -------------------------------
# @app.route("/api/products", methods=["GET"])
# def get_products():
#     products = []
#     for p in mongo.db.products.find():
#         p["_id"] = str(p["_id"])
#         products.append(p)
#     return jsonify(products)

# # -------------------------------
# # API to add a review to an existing product
# # -------------------------------
# @app.route("/api/products/<int:product_id>/reviews", methods=["POST"])
# def add_review(product_id):
#     data = request.get_json()
#     if not data:
#         return jsonify({"error": "No data provided"}), 400

#     review_doc = {
#         "id": data.get("id"),
#         "author": data.get("author"),
#         "review_date": datetime.strptime(data.get("review_date"), "%m/%d/%Y") if data.get("review_date") else None,
#         "avatarUrl": data.get("avatarUrl"),
#         "review_title": data.get("review_title", ""),
#         "review_text": data.get("review_text", data.get("comment", "")),
#         "review_rating": data.get("review_rating", data.get("rating", 0)),
#         "verified_purchase": data.get("verified_purchase", False),
#         "sentiment": None,
#         "length": None,
#         "sim": None,
#         "deviation": None,
#         "label": "Pending"
#     }

#     result = mongo.db.products.update_one(
#         {"id": product_id},
#         {"$push": {"reviews": review_doc}}
#     )

#     if result.matched_count == 0:
#         return jsonify({"error": "Product not found"}), 404

#     return jsonify({"message": "Review added"}), 201

# # -------------------------------
# # Run Flask
# # -------------------------------
# if __name__ == "__main__":
#     app.run(debug=True)
