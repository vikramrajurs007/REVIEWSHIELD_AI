import React from "react";
import { InfoIcon, BarChartIcon } from "../components/icons.jsx";

export const stats = [
  { id: 1, title: "Flagged for Review", value: "60", icon: <InfoIcon className="w-6 h-6 text-gray-400" /> },
  { id: 2, title: "Current Fake Rate", value: "25.0%", icon: <InfoIcon className="w-6 h-6 text-gray-400" /> },
  { id: 3, title: "Total Reviews Analyzed", value: "240", icon: <BarChartIcon className="w-6 h-6 text-gray-400" /> },
];
