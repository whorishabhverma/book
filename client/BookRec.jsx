export const getRecommendations = async (userId) => {
  try {
    const response = await fetch(`http://127.0.0.1:5000/recommendations?user_id=${userId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return [];
  }
};
