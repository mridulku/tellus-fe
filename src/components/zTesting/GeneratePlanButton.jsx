import React from "react";
import axios from "axios";

function GeneratePlanButton({ userId }) {
  // For demonstration, let's hardcode a targetDate.
  // You could also get this from a date picker, input, etc.
  const targetDate = "2025-07-20";

  const handleGeneratePlan = async () => {
    try {
      // Make a GET request with userId & targetDate as query params
      const res = await axios.get(
        "https://generateadaptiveplan-zfztjkkvva-uc.a.run.app",
        {
          params: {
            userId,
            targetDate,
          },
        }
      );

      // If it returns JSON, res.data should hold the success info
      console.log("Plan generated successfully:", res.data);
      alert("Plan generated successfully!");
    } catch (error) {
      console.error("Error generating plan:", error);
      alert("Failed to generate plan. See console for details.");
    }
  };

  // Render a button that triggers the plan generation
  return (
    <button onClick={handleGeneratePlan}>
      Generate Plan
    </button>
  );
}

export default GeneratePlanButton;