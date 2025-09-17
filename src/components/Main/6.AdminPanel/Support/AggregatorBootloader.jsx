// AggregatorBootloader.jsx
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAggregatorData } from "../../../../store/aggregatorSlice";

export default function AggregatorBootloader() {
  const dispatch    = useDispatch();
  const planStatus  = useSelector((s) => s.plan.status);  // 'succeeded' etc.

  useEffect(() => {
    if (planStatus === "succeeded") {
      dispatch(fetchAggregatorData());   // no args needed
    }
  }, [planStatus, dispatch]);

  return null;
}