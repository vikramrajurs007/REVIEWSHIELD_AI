from flask import Flask, request, jsonify,session
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_pymongo import PyMongo
from datetime import datetime
import pandas as pd
import nltk
from nltk.sentiment import SentimentIntensityAnalyzer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from bson import ObjectId
from dateutil import parser
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import datetime as dt
from dotenv import load_dotenv
import os
import joblib
import numpy as np
import uuid
import requests
from bson import ObjectId


load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY")



# ✅ CORS setup (only once)
CORS(
    app,
    supports_credentials=True,
    origins=["http://localhost:5173"],
    expose_headers=["Authorization"]
)

# Optional for cookies across origins
app.config["SESSION_COOKIE_SAMESITE"] = "None"
app.config["SESSION_COOKIE_SECURE"] = True  # Vercel uses HTTPS by default


# ✅ MongoDB setup
app.config["MONGO_URI"] = os.getenv("MONGO_URI")
mongo = PyMongo(app)
db = mongo.db
GEMINI_API= os.getenv("GEMINI_API")





# ✅ JWT setup
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
jwt = JWTManager(app)

bcrypt = Bcrypt(app)
model = joblib.load("ml_model/fake_review_model.pkl")
label_encoder = joblib.load("ml_model/label_encoder.pkl")
scaler = joblib.load("ml_model/scaler.pkl")
joblib.dump(model, "ml_model/review_model.pkl")
joblib.dump(label_encoder, "ml_model/label_encoder.pkl")
joblib.dump(scaler, "ml_model/scaler.pkl")


# ✅ Ensure VADER is ready
nltk.download('vader_lexicon', quiet=True)


# ✅ Initialize globally once
sia = SentimentIntensityAnalyzer()


# NLTK setup

# nltk.download("vader_lexicon")
nltk.download("punkt")
# sia = SentimentIntensityAnalyzer()


# Load dataset for TF-IDF similarity
def calculate_sentiment(review_text):
    try:
        if not review_text.strip():
            return 0.0
        score = sia.polarity_scores(review_text)
        print("🔍 Sentiment details:", score)
        return round(score["compound"], 3)
    except Exception as e:
        print("⚠️ Sentiment error:", e)
        return 0.0

try:
    dataset = pd.read_csv("reviews.csv").fillna("")
    tfidf = TfidfVectorizer(stop_words="english")
    tfidf_matrix = tfidf.fit_transform(dataset["review_text"])
    dataset["avg_rating"] = dataset.groupby("product_description")["review_rating"].transform("mean")
except FileNotFoundError:
    dataset = pd.DataFrame(columns=["product_description", "review_text", "review_rating"])
    tfidf = TfidfVectorizer(stop_words="english")
    tfidf_matrix = None



import time


def get_gemini_explanation(review_text, metadata, db=None, product_id=None, review_id=None):
    """
    Fetch AI explanation for a fake review using Gemini API.
    If db, product_id, and review_id are provided, store the explanation in MongoDB.
    """

    GEMINI_API = os.getenv("GEMINI_API")
    if not GEMINI_API:
        print("⚠️ Missing GEMINI_API key in environment variables.")
        return "No explanation available (API key missing)"

    api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API}"
    headers = {"Content-Type": "application/json"}

    # 🧠 Create a clear and concise prompt
    prompt = f"""
      You are an AI moderation assistant that explains why a review might be fake.
      Analyze carefully and give a short but clear explanation.

        Review text: "{review_text}"
        Rating: {metadata.get('review_rating')}
        Verified purchase: {metadata.get('verified_purchase')}
        Sentiment score: {metadata.get('sentiment')}
        Review length (words): {metadata.get('length')}
        Deviation score: {metadata.get('deviation')}

        Explain in 3–4 sentences, clearly describing which features (rating, tone, sentiment)
        made it suspicious. Use simple English.
     """


    data = {"contents": [{"parts": [{"text": prompt}]}]}
    ai_explanation = "No explanation available"

    try:
        # 🧠 Step 1: Make API request with retry logic
        for attempt in range(2):
            response = requests.post(api_url, headers=headers, json=data, timeout=15)

            if response.status_code == 429:
                print("⏳ Gemini API rate limit hit. Retrying in 10 seconds...")
                time.sleep(10)
                continue

            response.raise_for_status()
            result = response.json()
            print("🔍 Gemini API Raw Response:", result)

            # 🧩 Step 2: Extract explanation text safely
            ai_explanation = (
                result.get("candidates", [{}])[0]
                .get("content", {})
                .get("parts", [{}])[0]
                .get("text", "")
                .strip()
            )

            if not ai_explanation:
                ai_explanation = result.get("candidates", [{}])[0].get("output_text", "").strip()

            if not ai_explanation:
                ai_explanation = "No clear explanation returned by AI."

            break  # Exit retry loop if successful

    except requests.exceptions.Timeout:
        print("⚠️ Gemini API timeout.")
        ai_explanation = "Gemini API request timed out."
    except requests.exceptions.RequestException as e:
        print(f"⚠️ Gemini API error: {e}")
        ai_explanation = "Error while contacting Gemini API."
    except Exception as e:
        print(f"⚠️ Unexpected error: {e}")
        ai_explanation = "Unexpected error occurred while generating explanation."

    # 💾 Step 3: Save explanation to MongoDB (if db and IDs are valid)
    if db is not None and product_id and review_id:
        try:
            # Safely handle both ObjectId and string IDs
            query = {
                "$or": []
            }
            if ObjectId.is_valid(product_id):
                query["$or"].append({"_id": ObjectId(product_id)})
            query["$or"].append({"id": product_id})

            result = db.products.update_one(
                query,
                {"$set": {"reviews.$[r].explanation": ai_explanation}},
                array_filters=[{"r.review_id": review_id}],
            )

            if result.modified_count == 0:
                print(f"⚠️ MongoDB: No review updated for review_id {review_id}")

        except Exception as e:
            print(f"⚠️ MongoDB update error: {e}")

    return ai_explanation




@app.route("/api/signup", methods=["POST"])
def signup():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    # Check if username already exists
    existing_user = db.users.find_one({"username": username})
    if existing_user:
        return jsonify({"error": "Username already exists"}), 400

    hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")

    # Insert user into MongoDB
    db.users.insert_one({
        "username": username,
        "password": hashed_password,
        "created_at": datetime.utcnow()
    })

    # Create JWT token immediately after signup
    token = create_access_token(identity=username, expires_delta=dt.timedelta(days=1))

    # Optional: store session for backend routes using session
    session["username"] = username

    return jsonify({
        "message": "User registered successfully",
        "token": token,
        "username": username
    }), 201

# USER LOGIN

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    session["username"] = username


    user = db.users.find_one({"username": username})
    if not user:
        return jsonify({"error": "Invalid username or password"}), 401

    if not bcrypt.check_password_hash(user["password"], password):
        return jsonify({"error": "Invalid username or password"}), 401

    token = create_access_token(identity=username, expires_delta=dt.timedelta(days=1))

    return jsonify({
        "message": "Login successful",
        "token": token,
        "username": username
    }), 200

@app.route("/api/profile", methods=["GET"])
def get_profile():
    username = session.get("username")  # or None
    return jsonify({"username": username}), 200


# # -------------------------------
# # Logistic Regression Classifier
# # -------------------------------
def classify(data):
    try:
        features = np.array([[
            float(data.get("sentiment", 0)),
            float(data.get("length", 0)),
            float(data.get("similarity", 0)),
            float(data.get("deviation", 0)),
            float(data.get("review_rating", 0))
        ]])

        features_scaled = scaler.transform(features)
        prediction = model.predict(features_scaled)[0]
        label = label_encoder.inverse_transform([prediction])[0]
        confidence = model.predict_proba(features_scaled)[0][prediction]

        return {
            "label": label,
            "confidence": round(float(confidence), 2)
        }

    except Exception as e:
        print("❌ Classification error:", e)
        return {"label": "Unknown", "confidence": 0.0}
    


# -------------------------------
#  Review Classifier 
# -------------------------------
def classify_review(data):
    """
    data: dict that should contain at least:
      - review_text (string)
      - review_rating (numeric) OR rating
      - sentiment (float) [optional]
      - similarity (float) [optional]
      - deviation (float) [optional]
    The function will use provided sentiment/similarity/deviation when available.
    """
    try:
        review_text = str(data.get("review_text") or data.get("comment") or "").strip()
        sentiment = calculate_sentiment(review_text)
        # sentiment = float(data.get("sentiment") or 0.0)
        similarity = float(data.get("similarity") or 0.0)
        deviation = float(data.get("deviation") or 0.0)


        rating_raw = data.get("review_rating") or data.get("rating") or 0
        try:
            rating = float(rating_raw)
        except:
            rating = 0.0

        # Derived text features
        length = len(review_text.split())
        exclam_count = review_text.count("!")
        caps_count = sum(1 for c in review_text if c.isupper())
        caps_ratio = caps_count / len(review_text) if len(review_text) > 0 else 0

        # Debug
        print(f"CLASSIFIER DEBUG -> rating={rating}, sentiment={sentiment}, deviation={deviation}, similarity={similarity}, length={length}")

        # 1. Polarity mismatch (strong)
        if (rating <= 2 and sentiment > 0.2) or (rating >= 4 and sentiment < -0.2):
            return {"label": "Fake", "confidence": 0.95, "reason": "Rating–sentiment mismatch"}

        # 2. Too short or too long
        if length < 4 or length > 200:
            return {"label": "Fake", "confidence": 0.8, "reason": "Abnormal review length"}

        # 3. High deviation or copied review
        if deviation > 1.5 or similarity > 0.85:
            return {"label": "Fake", "confidence": 0.85, "reason": "High deviation or similarity"}

        # 4. Overly emotional tone
        if abs(sentiment) > 0.9:
            return {"label": "Fake", "confidence": 0.8, "reason": "Overly emotional tone"}

        # 5. Excessive punctuation / caps
        if exclam_count > 3 or caps_ratio > 0.25:
            return {"label": "Fake", "confidence": 0.75, "reason": "Excessive punctuation or capitalization"}

        # Otherwise
        return {"label": "Genuine", "confidence": 0.9, "reason": "No suspicious pattern detected"}

    except Exception as e:
        print("❌ Classification error:", e)
        return {"label": "Unknown", "confidence": 0.0, "reason": str(e)}



# def calculate_sentiment(review_text):
#     try:
#         print("🔍 Sentiment input:", review_text)
#         return round(sia.polarity_scores(review_text)["compound"], 3)
#     except Exception as e:
#         print("⚠️ Sentiment error:", e)
#         return 0.0


def calculate_similarity(review_text):
    try:
        if not review_text or dataset is None or dataset.empty:
            return 0.0

        texts = dataset["review_text"].tolist() + [review_text]
        tfidf_local = TfidfVectorizer(stop_words="english").fit_transform(texts)
        cosine_sim = cosine_similarity(tfidf_local[-1], tfidf_local[:-1])
        return round(float(cosine_sim.mean()), 3)

    except Exception as e:
        print("⚠️ Error calculating similarity:", e)
        return 0.0



def calculate_deviation(product_id, review_rating):
    try:
        # Choose the correct query filter
        if ObjectId.is_valid(str(product_id)):
            query = {"_id": ObjectId(product_id)}
        else:
            query = {"id": int(product_id)} if str(product_id).isdigit() else {"id": product_id}

        # Fetch only ratings
        product = db.products.find_one(query, {"reviews.review_rating": 1})

        # Handle missing or empty reviews
        if not product or not product.get("reviews"):
            return 0.0

        # Extract valid ratings
        ratings = [float(r.get("review_rating", 0)) for r in product["reviews"] if "review_rating" in r]
        if not ratings:
            return 0.0

        # Compute deviation
        avg_rating = sum(ratings) / len(ratings)
        deviation = abs(float(review_rating) - avg_rating)
        return round(deviation, 3)

    except Exception as e:
        print("⚠️ Error calculating deviation:", e)
        return 0.0

@app.route("/api/products/<product_id>/reviews", methods=["POST"])
def add_review(product_id):
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    query = {"$or": []}
    try:
        query["$or"].append({"_id": ObjectId(product_id)})
    except:
        pass
    try:
        query["$or"].append({"id": int(product_id)})
    except:
        pass

    product = db.products.find_one(query, {"description": 1})
    if not product:
        return jsonify({"error": "Product not found"}), 404
    product_description = product.get("description", "")

    # parse review_date
    try:
        review_date = parser.parse(data.get("review_date", ""))
    except:
        review_date = datetime.utcnow()

    # get text and rating
    review_text = data.get("review_text", data.get("comment", "")).strip()
    try:
        review_rating = float(data.get("review_rating", data.get("rating", 0)))
    except:
        review_rating = 0.0

    # ----------------------------
    # compute features BEFORE classification
    sentiment = calculate_sentiment(review_text)
    similarity = calculate_similarity(review_text)
    deviation = calculate_deviation(product_id, review_rating)

    # Prepare a dict with computed features to pass to classifier
    features_for_classification = {
        "review_text": review_text,
        "review_rating": review_rating,
        "sentiment": sentiment,
        "similarity": similarity,
        "deviation": deviation
    }

    # classify now using accurate features
    classified = classify_review(features_for_classification)

    # prepare review doc (include computed features and classifier result)
    review_doc = {
        "review_id": str(uuid.uuid4()),
        "author": data.get("username", "Guest User"),
        "review_date": review_date,
        "avatarUrl": data.get("avatarUrl"),
        "review_title": data.get("review_title", ""),
        "review_text": review_text,
        "review_rating": review_rating,
        "verified_purchase": data.get("verified_purchase", False),
        "sentiment": sentiment,
        "length": len(review_text.split()),
        "similarity": similarity,
        "deviation": deviation,
        "explanation": "No explanation available",
        # merge classifier outputs (label, confidence, reason)
        "label": classified.get("label"),
        "confidence": classified.get("confidence"),
        "reason": classified.get("reason"),
    }

    # save review
    result = db.products.update_one(query, {"$push": {"reviews": review_doc}})
    if result.matched_count == 0:
        return jsonify({"error": "Product not found"}), 404

    # if fake -> call AI explanation and update DB
    if str(review_doc.get("label", "")).lower() == "fake":
        metadata = {
            "review_rating": review_doc["review_rating"],
            "verified_purchase": review_doc["verified_purchase"],
            "sentiment": review_doc["sentiment"],
            "length": review_doc["length"],
            "deviation": review_doc["deviation"],
        }
        explanation = get_gemini_explanation(
            review_doc["review_text"],
            metadata,
            db=db,
            product_id=product_id,
            review_id=review_doc["review_id"],
        )
        db.products.update_one(
            query,
            {"$set": {"reviews.$[r].explanation": explanation}},
            array_filters=[{"r.review_id": review_doc["review_id"]}],
        )
        review_doc["explanation"] = explanation

    # format date for response
    if hasattr(review_doc["review_date"], "isoformat"):
        review_doc["review_date"] = review_doc["review_date"].isoformat()

    return jsonify({"message": "Review added successfully", "review": review_doc}), 201





# -------------------------------
# Predict review authenticity (API test)
# -------------------------------
@app.route("/api/reviews/predict", methods=["POST"])
def predict_review():
    data = request.get_json() or {}
    review_text = data.get("review_text", "")
    product_id = data.get("product_id")  # optional, used for deviation


    if "sentiment" not in data:
        data["sentiment"] = calculate_sentiment(review_text)
    if "length" not in data:
        data["length"] = len(review_text.split())
    if "similarity" not in data:
        product_desc = data.get("product_description", "")
        data["similarity"] = calculate_similarity(review_text, product_desc) if product_desc else 0.0
    if "deviation" not in data:
        if product_id:
            data["deviation"] = calculate_deviation(product_id, data.get("review_rating", 0))
        else:
            data["deviation"] = float(data.get("deviation", 0))

    result = classify_review(data)
    return jsonify(result)




# -------------------------------
# Helper: Create product document
# -------------------------------
def create_product_doc(product_data):
    reviews = []
    for rev in product_data.get("reviews", []):
        classified = classify_review(rev)
        review_date = None
        if rev.get("review_date"):
            try:
                review_date = parser.parse(rev["review_date"])
            except:
                review_date = datetime.utcnow()
        reviews.append({
            "id": rev.get("id"),
            "author": rev.get("author", "Anonymous"),
            "review_date": review_date,
            "avatarUrl": rev.get("avatarUrl"),
            "review_title": rev.get("review_title", ""),
            "review_text": rev.get("review_text", rev.get("comment", "")),
            "review_rating": rev.get("review_rating", rev.get("rating", 0)),
            "verified_purchase": rev.get("verified_purchase", False),
            **classified
        })
    return {
        "id": product_data.get("id"),
        "name": product_data.get("name"),
        "category": product_data.get("category"),
        "price": product_data.get("price"),
        "description": product_data.get("description"),
        "imageUrl": product_data.get("imageUrl"),
        "reviews": reviews,
        "createdAt": datetime.utcnow()
    }

# -------------------------------
# Routes
# -------------------------------
@app.route("/")
def home():
    return jsonify({"message": "MongoDB Connected Successfully!"})

@app.route("/api/products", methods=["POST"])
def add_product():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    product_doc = create_product_doc(data)
    result = db.products.insert_one(product_doc)
    return jsonify({"message": "Product added", "id": str(result.inserted_id)}), 201

@app.route("/api/products", methods=["GET"])
def get_products():
    products = []
    for p in db.products.find():
        p["_id"] = str(p["_id"])
        for rev in p.get("reviews", []):
            if rev.get("review_date"):
                rev["review_date"] = rev["review_date"].isoformat()
        products.append(p)
    return jsonify(products), 200

@app.route("/api/products/<product_id>", methods=["GET"])

def get_product(product_id):
    query = {"$or": []}
    try:
        query["$or"].append({"_id": ObjectId(product_id)})
    except:
        pass
    try:
        query["$or"].append({"id": int(product_id)})
    except:
        pass
    product = db.products.find_one(query)
    if not product:
        return jsonify({"error": "Product not found"}), 404
    product["_id"] = str(product["_id"])
    for rev in product.get("reviews", []):
        if rev.get("review_date"):
            rev["review_date"] = rev["review_date"].isoformat()
    return jsonify(product)

@app.route("/api/products/<product_id>/reviews", methods=["GET"])
def get_reviews(product_id):
    query = {"$or": []}
    try:
        query["$or"].append({"_id": ObjectId(product_id)})
    except:
        pass
    try:
        query["$or"].append({"id": int(product_id)})
    except:
        pass
    product = db.products.find_one(query)
    if not product:
        return jsonify({"error": "Product not found"}), 404
    genuine_reviews = [rev for rev in product.get("reviews", []) if rev.get("label") == "Genuine"]
    for rev in genuine_reviews:
        if rev.get("review_date"):
            rev["review_date"] = rev["review_date"].isoformat()
    return jsonify(genuine_reviews)



# -------------------------------
# Admin Dashboard APIs
# -------------------------------
@app.route("/api/admin/stats", methods=["GET"])

def get_admin_stats():
    try:
        total_pipeline = [
            {"$unwind": {"path": "$reviews", "preserveNullAndEmptyArrays": True}},
            {"$group": {"_id": None, "total": {"$sum": {"$cond": [{"$ifNull": ["$reviews", False]}, 1, 0]}}}}
        ]
        total_result = list(db.products.aggregate(total_pipeline))
        total_reviews = total_result[0]["total"] if total_result else 0

        flagged_pipeline = [
            {"$unwind": {"path": "$reviews", "preserveNullAndEmptyArrays": False}},
            {"$match": {"$expr": {"$eq": [{"$toLower": {"$ifNull": ["$reviews.label", ""]}}, "fake"]}}},
            {"$count": "flagged_count"}
        ]
        flagged_result = list(db.products.aggregate(flagged_pipeline))
        flagged_reviews = flagged_result[0]["flagged_count"] if flagged_result else 0

        fake_rate = round((flagged_reviews / total_reviews) * 100, 2) if total_reviews > 0 else 0.0

        return jsonify({
            "flagged_count": int(flagged_reviews),
            "total_reviews": int(total_reviews),
            "fake_rate": fake_rate
        }), 200

    except Exception as e:
        app.logger.exception("Error computing admin stats")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/admin/flagged-reviews", methods=["GET"])
def get_flagged_reviews():
    flagged_reviews = []
    try:
        products = db.products.find({}, {"name": 1, "reviews": 1})

        for product in products:
            product_name = product.get("name", "Unnamed Product")
            product_id = str(product.get("_id"))

            for idx, review in enumerate(product.get("reviews", [])):
                # Only include fake reviews
                if str(review.get("label", "")).strip().lower() != "fake":
                    continue

                # Safely format date
                review_date = review.get("review_date")
                if hasattr(review_date, "isoformat"):
                    review_date = review_date.isoformat()
                elif not isinstance(review_date, str):
                    review_date = None

                # Use stored explanation, or show fallback
                explanation = review.get("explanation", "No explanation available")

                # Append the flagged review
                flagged_reviews.append({
                    "product_name": product_name,
                    "product_id": product_id,
                    "review_index": idx,
                    "author": review.get("author", "Anonymous"),
                    "review_title": review.get("review_title", ""),
                    "review_text": review.get("review_text", ""),
                    "review_rating": review.get("review_rating"),
                    "verified_purchase": review.get("verified_purchase", False),
                    "sentiment": review.get("sentiment"),
                    "length": review.get("length"),
                    "similarity": review.get("similarity"),
                    "deviation": review.get("deviation"),
                    "label": review.get("label"),
                    "review_date": review_date,
                    "explanation": explanation,
                })

        # Sort reviews by date (descending)
        flagged_reviews.sort(key=lambda r: r.get("review_date") or "", reverse=True)

        return jsonify(flagged_reviews), 200

    except Exception as e:
        import traceback
        print("❌ Error in get_flagged_reviews:", e)
        print(traceback.format_exc())
        return jsonify({"error": "Internal Server Error"}), 500

@app.route("/api/admin/approve-review/<product_id>/<int:review_index>", methods=["PUT"])
def approve_review(product_id, review_index):
    try:
        product = db.products.find_one({"_id": ObjectId(product_id)})
        if not product or review_index >= len(product.get("reviews", [])):
            return jsonify({"error": "Review not found"}), 404
        product["reviews"][review_index]["label"] = "Genuine"
        db.products.update_one({"_id": ObjectId(product_id)}, {"$set": {"reviews": product["reviews"]}})
        return jsonify({"message": "Review approved successfully"}), 200
    except Exception as e:
        app.logger.exception("Error approving review")
        return jsonify({"error": "Failed to approve review"}), 500

@app.route("/api/admin/delete-review/<product_id>/<int:review_index>", methods=["DELETE"])
def delete_review(product_id, review_index):
    try:
        product = db.products.find_one({"_id": ObjectId(product_id)})
        if not product or review_index >= len(product.get("reviews", [])):
            return jsonify({"error": "Review not found"}), 404
        product["reviews"].pop(review_index)
        db.products.update_one({"_id": ObjectId(product_id)}, {"$set": {"reviews": product["reviews"]}})
        return jsonify({"message": "Review deleted successfully"}), 200
    except Exception as e:
        app.logger.exception("Error deleting review")
        return jsonify({"error": "Failed to delete review"}), 500
    
# -----------------------------------
# 🧍 Get Current Logged-in User


@app.route("/api/auth/user", methods=["GET"])
def get_current_user():
    username = session.get("username")
    if username:
        return jsonify({"username": username}), 200
    else:
        return jsonify({"error": "Not logged in"}), 401

# -------------------------------
# Run Flask
# -------------------------------
if __name__ == "__main__":
    app.run(debug=False)




