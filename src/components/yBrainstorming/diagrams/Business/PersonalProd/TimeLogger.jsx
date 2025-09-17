import React, { useEffect, useState } from "react";
import { db } from "../../../../../firebase"; // adjust import path as needed
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";

function TimeLogger() {
  // State for selected date (YYYY-MM-DD format)
  const [selectedDate, setSelectedDate] = useState("");
  
  // 96 slots for each 15-minute interval
  const [activities, setActivities] = useState(Array(96).fill(""));
  
  // The current text input for a new activity
  const [currentActivity, setCurrentActivity] = useState("");
  
  // Keep track of unique activities for shortcut buttons
  const [uniqueActivities, setUniqueActivities] = useState(new Set());

  // Selected time slots (for multi-select feature)
  const [selectedSlots, setSelectedSlots] = useState(new Set());

  // ------------------------------
  // 1) On mount, set today's date and current slot as default
  // ------------------------------
  useEffect(() => {
    const todayStr = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
    setSelectedDate(todayStr);
    setSelectedSlots(new Set([getCurrentSlot()])); // Default: Select current slot
  }, []);

  // Whenever 'selectedDate' changes, refetch data for that date
  useEffect(() => {
    if (selectedDate) {
      fetchActivitiesForDate(selectedDate);
    }
  }, [selectedDate]);

  // ------------------------------
  // 2) Fetch existing logs for the chosen date
  // ------------------------------
  const fetchActivitiesForDate = async (dateStr) => {
    try {
      const q = query(collection(db, "TimeLogger"), where("date", "==", dateStr));
      const querySnap = await getDocs(q);

      const temp = Array(96).fill("");
      const usedActivities = new Set();

      querySnap.forEach((docSnap) => {
        const data = docSnap.data();
        const slotIndex = data.slotNumber;
        const activityText = data.activity || "";
        if (slotIndex >= 0 && slotIndex < 96) {
          temp[slotIndex] = activityText;
          if (activityText.trim()) {
            usedActivities.add(activityText);
          }
        }
      });

      setActivities(temp);
      setUniqueActivities(usedActivities);
    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  };

  // ------------------------------
  // 3) Calculate current 15-min slot (0..95)
  // ------------------------------
  const getCurrentSlot = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    return Math.floor(totalMinutes / 15); // 0..95
  };

  // ------------------------------
  // 4) Submit (upsert) activity for selected slots
  // ------------------------------
  const handleSubmit = async () => {
    if (!selectedDate || selectedSlots.size === 0 || !currentActivity.trim()) return;

    const updated = [...activities];

    for (let slotIndex of selectedSlots) {
      updated[slotIndex] = currentActivity;

      // Create/overwrite doc in Firestore
      const docId = `${selectedDate}-${slotIndex}`;
      try {
        await setDoc(doc(db, "TimeLogger", docId), {
          date: selectedDate,
          slotNumber: slotIndex,
          activity: currentActivity,
        });
        console.log(`Activity logged for slot ${slotIndex}`);
      } catch (error) {
        console.error("Error writing to Firestore:", error);
      }
    }

    setActivities(updated);
    setUniqueActivities((prev) => new Set([...prev, currentActivity]));
    setCurrentActivity(""); // Clear input
  };

  // ------------------------------
  // 5) Toggle selection of slots (for multi-select feature)
  // ------------------------------
  const toggleSlotSelection = (slotIndex) => {
    setSelectedSlots((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(slotIndex)) {
        newSet.delete(slotIndex);
      } else {
        newSet.add(slotIndex);
      }
      return newSet;
    });
  };

  // ------------------------------
  // 6) Generate statistics for the day
  // ------------------------------
  const filledSlots = activities.filter((a) => a.trim() !== "").length;

  const activityCounts = activities.reduce((acc, activity) => {
    const key = activity.trim();
    if (key) {
      acc[key] = (acc[key] || 0) + 1;
    }
    return acc;
  }, {});

  // ------------------------------
  // 7) Render
  // ------------------------------
  return (
    <div style={{ padding: "1rem", maxWidth: "600px", margin: "0 auto" }}>
      <h2>15-Minute Interval Logger</h2>

      {/* Date Selector */}
      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="dateSelector">Select Date: </label>
        <input
          id="dateSelector"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>

      {/* Activity Input */}
      <div style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Enter activity..."
          value={currentActivity}
          onChange={(e) => setCurrentActivity(e.target.value)}
          style={{ width: "70%", marginRight: "1rem" }}
        />
        <button onClick={handleSubmit}>Submit</button>
      </div>

      {/* Quick Select Buttons for Past Activities */}
      <div style={{ marginBottom: "1rem" }}>
        <p>Quick Select:</p>
        {[...uniqueActivities].map((act) => (
          <button key={act} style={{ marginRight: "0.5rem", marginBottom: "0.5rem" }} onClick={() => setCurrentActivity(act)}>
            {act}
          </button>
        ))}
      </div>

      {/* Slot Selector */}
      <h3>Select Time Slots:</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: "5px" }}>
        {[...Array(96)].map((_, index) => {
          const isSelected = selectedSlots.has(index);
          return (
            <button
              key={index}
              style={{
                padding: "5px",
                backgroundColor: isSelected ? "lightblue" : "#f0f0f0",
                border: "1px solid #ccc",
                cursor: "pointer",
              }}
              onClick={() => toggleSlotSelection(index)}
            >
              {index + 1}
            </button>
          );
        })}
      </div>

      {/* Logged Activities */}
      <h3>Logged Activities ({filledSlots} / 96 Slots Used)</h3>
      <ul>
        {activities.map((activity, index) => {
          if (!activity.trim()) return null;

          return (
            <li key={index}>
              <strong>Slot #{index + 1}:</strong> {activity}
            </li>
          );
        })}
      </ul>

      {/* Activity Statistics */}
      <h3>Statistics for {selectedDate}</h3>
      <ul>
        {Object.entries(activityCounts).map(([act, count]) => (
          <li key={act}>
            <strong>{act}:</strong> {count} time{count > 1 ? "s" : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TimeLogger;