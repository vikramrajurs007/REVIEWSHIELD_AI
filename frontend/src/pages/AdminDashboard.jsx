import React, { useEffect, useState } from "react";
import Footer from "../components/Footer";
import StatCard from "../components/StatCard";
import FlaggedReviewCard from "../components/FlaggedReviewCard";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [flaggedReviews, setFlaggedReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);

  const API_BASE = "http://127.0.0.1:5000/api/admin";

  // Fetch admin stats & flagged reviews (public access)
  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [statsRes, flaggedRes] = await Promise.all([
        fetch(`${API_BASE}/stats`),
        fetch(`${API_BASE}/flagged-reviews`),
      ]);

      if (!statsRes.ok || !flaggedRes.ok) {
        throw new Error("Failed to load admin data");
      }

      const statsData = await statsRes.json();
      const flaggedData = await flaggedRes.json();

      setStats(statsData);
      setFlaggedReviews(flaggedData);
    } catch (error) {
      console.error("❌ Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchDashboardData();
  }, [refresh]);

  const handleActionComplete = () => {
    setRefresh((prev) => !prev);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        Loading admin data...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-300 font-sans">

      <main className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-4xl font-extrabold text-white mb-2">
          Admin Dashboard
        </h1>
        <p className="text-lg text-gray-400 mb-8">
          Welcome, <span className="text-purple-400">Admin</span> 👋  
          <br />
          Moderation queue for reviews flagged as fake.
        </p>

        {/* Stats Section */}
        {stats && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <StatCard
              stat={{
                id: 1,
                title: "Flagged for Review",
                value: stats.flagged_count ?? "0",
              }}
            />
            <StatCard
              stat={{
                id: 2,
                title: "Current Fake Rate",
                value: `${stats.fake_rate ?? 0}%`,
              }}
            />
            <StatCard
              stat={{
                id: 3,
                title: "Total Reviews Analyzed",
                value: stats.total_reviews ?? "0",
              }}
            />
          </section>
        )}

        {/* Flagged Reviews Section */}
        <section>
          <h2 className="text-3xl font-bold text-white mb-6">
            Flagged Reviews
          </h2>
          <div className="space-y-6">
            {flaggedReviews.length > 0 ? (
              flaggedReviews.map((review, idx) => (
                <FlaggedReviewCard
                  key={idx}
                  review={review}
                  onAction={handleActionComplete}
                />
              ))
            ) : (
              <p className="text-gray-400">No flagged reviews found.</p>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AdminDashboard;


