const API_BASE_URL = "http://4.237.58.241:3000/rentals/states";

export async function fetchData() {
  try {
    const response = await fetch(API_BASE_URL);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}